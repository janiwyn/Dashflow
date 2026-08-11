/**
 * Web Bluetooth isn't part of TypeScript's DOM lib (it's a non-standard,
 * Chromium-only API), so the pieces src/lib/printing/bluetooth-printer.ts
 * actually uses are declared by hand here.
 * Spec: https://webbluetoothcg.github.io/web-bluetooth/
 */

interface BluetoothCharacteristicProperties {
  readonly write: boolean;
  readonly writeWithoutResponse: boolean;
}

interface BluetoothRemoteGATTCharacteristic {
  readonly properties: BluetoothCharacteristicProperties;
  writeValueWithResponse(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
}

interface BluetoothRemoteGATTService {
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTServer {
  readonly connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothDevice extends EventTarget {
  readonly name?: string;
  readonly gatt?: BluetoothRemoteGATTServer;
}

interface RequestDeviceOptions {
  acceptAllDevices?: boolean;
  filters?: Array<{ services?: (string | number)[]; name?: string; namePrefix?: string }>;
  optionalServices?: (string | number)[];
}

interface Bluetooth {
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
}

interface Navigator {
  readonly bluetooth?: Bluetooth;
}
