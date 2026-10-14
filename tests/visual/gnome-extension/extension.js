// Helper shell extension for the visual tray test on GNOME Wayland.
//
// Mutter implements neither wlr-screencopy (so `grim` is out) nor an
// unrestricted screenshot D-Bus API — `org.gnome.Shell.Screenshot` only
// accepts calls from the portal and the settings daemon. The one remaining way
// to grab the stage is in-process, so this extension exports a small D-Bus
// method that runs `Shell.Screenshot` inside the shell and reports whether the
// PNG was written.
//
// `run.mts` drives it synchronously with `gdbus call ... Capture <path>`.

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

Gio._promisify(Shell.Screenshot.prototype, 'screenshot', 'screenshot_finish');

const BUS_NAME = 'io.github.menubar.Screenshot';
const OBJECT_PATH = '/io/github/menubar/Screenshot';

const IFACE_XML = `
<node>
  <interface name="${BUS_NAME}">
    <method name="Capture">
      <arg type="s" direction="in" name="filename"/>
      <arg type="b" direction="out" name="success"/>
    </method>
  </interface>
</node>`;

export default class MenubarScreenshotExtension extends Extension {
  enable() {
    this._dbus = Gio.DBusExportedObject.wrapJSObject(IFACE_XML, this);
    this._dbus.export(Gio.DBus.session, OBJECT_PATH);
    this._nameId = Gio.bus_own_name(
      Gio.BusType.SESSION,
      BUS_NAME,
      Gio.BusNameOwnerFlags.NONE,
      null,
      null,
      null,
    );
  }

  async CaptureAsync(params, invocation) {
    const [filename] = params;
    let success = false;
    try {
      const stream = Gio.File.new_for_path(filename).replace(
        null,
        false,
        Gio.FileCreateFlags.REPLACE_DESTINATION,
        null,
      );
      try {
        await new Shell.Screenshot().screenshot(false, stream);
        success = true;
      } finally {
        stream.close(null);
      }
    } catch (error) {
      console.error(`${BUS_NAME}: screenshot failed: ${error}`);
    }
    invocation.return_value(new GLib.Variant('(b)', [success]));
  }

  disable() {
    if (this._nameId) {
      Gio.bus_unown_name(this._nameId);
      this._nameId = 0;
    }
    this._dbus?.unexport();
    this._dbus = null;
  }
}
