const iTagIdentify = peripheral =>
  (error, services, characteristics) => {
    if (!characteristics) {
      return;
    }

    const characteristic = characteristics[0];
    characteristic.write(Buffer.from([0x02]), true, (er1) => {
      if (er1) {
        return;
      }

      setTimeout(() => {
        characteristic.write(Buffer.from([0x00]), true, (er2) => {
          if (er2) {
            return;
          }

          peripheral.disconnect();
        });
      }, 2000);
    });
  };


module.exports = (device) => {
  const { peripheral } = device;

  peripheral.connect((error) => {
    if (!error) {
      // Support for iTag devices
      peripheral.discoverSomeServicesAndCharacteristics(['1802'], ['2a06'], iTagIdentify(peripheral));
    }
  });
};
