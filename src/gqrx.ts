import {Socket} from "net";
import * as util from "util";

interface GqrxOptions {
  host?: string;
  port?: number;
}

type ModulatorMode =
  | "OFF"
  | "RAW"
  | "AM"
  | "FM"
  | "WFM"
  | "WFM_ST"
  | "WFM_ST_OIRT"
  | "LSB"
  | "USB"
  | "CW"
  | "CWL"
  | "CWU"


export class Gqrx {
  options: GqrxOptions = {
    host: "127.0.0.1",
    port: 7356
  };

  private client: Socket | null = null;
  private queue: { [key:number]: (err: Error | null, data: string) => any } = {};
  private lastRequestId: number = 0;
  private lastRequestCompleted: number = -1;

  constructor(options?: GqrxOptions) {
    if (options) {
      Object.assign(this.options, options);
    }
  }

  connect(
    onConnected?: (() => any) | null,
    onData?: ((err: any, data?: string) => any) | null,
    onClose?: (() => any) | null
  ) {
    this.client = new Socket();
    if (onClose) this.client.on("close", onClose);
    this.onData(data => {
      if (onData) onData(data);
      // this.lastRequestCompleted++;
      // if (this.lastRequestCompleted in this.queue) {
      //   this.queue[this.lastRequestCompleted](null, data);
      // }
    });
    this.client.connect(this.options.port!!, this.options.host!!, onConnected || undefined);

  }

  getFrequencySync = async () => {
    return parseInt(await this.writeForResponseSync("f")!!);
  };

  setFrequencySync = async (freq: string | number) => {
    return await this.writeForResponseSync(`F ${freq}`);
  };

  getModulatorModeSync = async () => {
    return (await this.writeForResponseSync("m")).split(/[\s]+/)[0];
  };

  setModulatorModeSync = async (mode: ModulatorMode) => {
    return await this.writeForResponseSync(`M ${mode}`);
  };

  getSignalStrengthSync = async () => {
    return parseFloat(await this.writeForResponseSync("l STRENGTH"));
  };

  getSquelchSync = async () => {
    return parseFloat(await this.writeForResponseSync("l SQL"));
  };

  setSquelchSync = async (squelch: string | number) => {
    return await this.writeForResponseSync(`L SQL ${squelch}`);
  };

  getRecorderStatusSync = async() => {
    return await this.writeForResponseSync("u RECORD");
  };

  startRecordingSync = async () => {
    return await this.writeForResponseSync("AOS");
  };

  stopRecordingSync = async () => {
    return await this.writeForResponseSync("LOS");
  };

  // TODO: Parse?
  dumpStateSync = async() => {
    return await this.writeForResponseSync("\\dump_state");
  };

  writeForResponseSync = async (data: string) => {
    const promise = util.promisify(this.writeForResponse).bind(this);
    return await promise(data);
  };

  getFrequency(callback: (freq: string) => any) {
    this.writeForResponse("f", (err, res) => callback(res!!));
  }

  setFrequency(freq: string, callback: (data: string) => any) {
    this.writeForResponse(`F ${freq}`, (err, res) => callback(res!!));
  }

  getModulatorMode(callback: (data: ModulatorMode) => any) {
    this.writeForResponse("m", (err, res) => callback(res!!.split(/[\r\n]+/g)[0] as ModulatorMode));
  }

  setModulatorMode(mode: ModulatorMode, callback: (data: string) => any) {
    this.writeForResponse(`M ${mode}`, (err, res) => callback(res!!));
  }

  getSignalStrength(callback: (data: number) => any) {
    this.writeForResponse("l", (err, res) => callback(parseFloat(res!!)));
  }

  getSquelch(callback: (data: string) => any) {
    this.writeForResponse("l SQL", (err, res) => callback(res!!));
  }

  setSquelce(squelch: number, callback: (data: string) => any) {
    this.writeForResponse(`l SQL ${squelch}`, (err, res) => callback(res!!));
  }

  getRecorderStatus(callback: (data: string) => any) {
    this.writeForResponse("u RECORD", (err, res) => callback(res!!));
  }

  startRecording(callback: (data: string) => any) {
    this.writeForResponse("AOS", (err, res) => callback(res!!));
  }

  stopRecording(callback: (data: string) => any) {
    this.writeForResponse("LOS", (err, res) => callback(res!!));
  }

  dumpState(callback: (data: string) => any) {
    this.writeForResponse("\\dump_state", (err, res) => callback(res!!));
  }

  write(data: string) {
    this.client!!.write(data);
  }

  writeLine(data: string) {
    this.write(`${data}\r\n`);
  }

  writeForResponse(data: any, response: (err: Error | null, result: string) => void) {
    this.queue[this.lastRequestId++] = response;
    this.writeLine(data.toString());
  }

  disconnect() {
    if (this.client) {
      this.client.destroy();
    }
  }

  private onData(callback?: ((data: string) => any) | null) {
    this.client!!.on("data", data => {
      this.lastRequestCompleted++;
      if (this.lastRequestCompleted in this.queue) {
        this.queue[this.lastRequestCompleted](null, data.toString().trim());
        delete this.queue[this.lastRequestCompleted];
      }
      if (callback) {
        callback(data.toString());
      }
    });
  }
}
