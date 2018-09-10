
# Automation - Bluetooth presence  
  
Example config.json:  
  
```json
{
  "accessories": [
    {
      "accessory": "AutomationBluetoothPresence",
      "name": "Dad's iTag",
      "deviceId": "65504c9b6e5441f8927bbd768e455d4f",
      "gracePeriod": 600
    }
  ]
}
```

This accessory will create a motion sensor linked with a Bluetooth device.

When the device is found, the motion sensor is triggered. When the device is not seen for longer than `gracePeriod`, the motion sensor will stop detecting movement.

## Configuration options  
  
| Attribute | Required | Usage | Example |
|-----------|----------|-------|---------|
| name | Yes | A unique name for the accessory. It will be used as the accessory name in HomeKit. | `Dad's iTag` |
| deviceId | Yes | The device ID. | `65504c9b6e5441f8927bbd768e455d4f` |
| gracePeriod | No (default: `600`) | The number of seconds to wait for announcements before considering the device gone. 10 minutes (600 seconds) is recommended. | `600` (seconds, equal to 10 mintues) |

## Find the device ID
Run `npm run detect-devices` and wait. A list of devices will appear on screen. Grab the device ID from the list and add it to the config.  

## Devices that can be monitored
You can track:
- Phones
- Tables
- (some) Computers
- Smart watches
- Headphones / Earphones
- Fitness trackers
- Cheap key fobs like the ["iTag" devices](https://www.gearbest.com/itag-_gear/) or [Tile trackers](https://www.thetileapp.com/)