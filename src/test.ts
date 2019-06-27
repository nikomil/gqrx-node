import {Gqrx} from "./gqrx";

const gqrx = new Gqrx();

process.on("SIGINT", () => {
  console.log("Peacing out");
  gqrx.disconnect();
});

(async () => {
  gqrx.connect(async () => {
    console.log(`Frequency: "${await gqrx.getFrequencySync()}"`);
    console.log(`Modulator mode: "${await gqrx.getModulatorModeSync()}"`);
    console.log(`Signal strength: ${await gqrx.getSignalStrengthSync()}`);
    console.log(`Squelch: ${await gqrx.getSquelchSync()}`);
    console.log(`Recorder status: ${await gqrx.getRecorderStatusSync()}`);
    console.log(`Dump state: ${await gqrx.dumpStateSync()}`);
  }, null, () => console.log("Connection closed"));
})();

// gqrx.connect(() => {
//   gqrx.getFrequency(freq => `Frequency: ${freq}`);
//   // gqrx.getModulatorMode(mode => console.log(`Modular mode: ${mode}`));
//   // gqrx.getSignalStrength(strength => console.log(`Signal strength: ${strength}`));
//   // gqrx.getSquelch(squelch => console.log(`Squelch: ${squelch}`));
//   // gqrx.getRecorderStatus(status => console.log(`Recorder status: ${status}`));
//   // gqrx.dumpState(state => console.log(`Dump state: ${state}`));
// }, null, () => console.log("Connection closed"));
