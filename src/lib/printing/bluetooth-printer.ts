/**
 * Web Bluetooth transport for the ESC/POS thermal printers used at the
 * till. There's no single standard GATT profile for these — cheap 58mm/80mm
 * printers each expose their own vendor service — so instead of hard-coding
 * one vendor's UUID, this asks for any Bluetooth device and then probes it
 * for the first characteristic that accepts writes. That's the same
 * approach open-source ESC/POS-over-BLE printer apps use in practice.
 *
 * Requires Web Bluetooth (Chrome/Edge on desktop and Android; not available
 * in Safari or Firefox) and a page served over HTTPS or http://localhost.
 */

/** Common thermal-printer BLE service UUIDs, offered as connection candidates. */
const KNOWN_PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
];

/** BLE writes are capped per-call — old stacks choke above ~180 bytes. */
const CHUNK_SIZE = 180;
const CHUNK_DELAY_MS = 20;

export function isBluetoothPrintingSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

async function findWritableCharacteristic(
  server: BluetoothRemoteGATTServer,
): Promise<BluetoothRemoteGATTCharacteristic> {
  const services = await server.getPrimaryServices();
  for (const service of services) {
    const characteristics = await service.getCharacteristics();
    const writable = characteristics.find(
      (c) => c.properties.write || c.properties.writeWithoutResponse,
    );
    if (writable) return writable;
  }
  throw new Error("This device doesn't expose a printable Bluetooth service.");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class BluetoothPrinter {
  private constructor(
    public readonly device: BluetoothDevice,
    private readonly characteristic: BluetoothRemoteGATTCharacteristic,
  ) {}

  static async request(): Promise<BluetoothPrinter> {
    if (!navigator.bluetooth) {
      throw new Error("This browser doesn't support Web Bluetooth. Try Chrome or Edge.");
    }

    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: KNOWN_PRINTER_SERVICES,
    });
    if (!device.gatt) throw new Error("This device doesn't support GATT connections.");

    const server = await device.gatt.connect();
    const characteristic = await findWritableCharacteristic(server);
    return new BluetoothPrinter(device, characteristic);
  }

  get name(): string {
    return this.device.name ?? "Unnamed printer";
  }

  get connected(): boolean {
    return this.device.gatt?.connected ?? false;
  }

  onDisconnect(handler: () => void): () => void {
    this.device.addEventListener("gattserverdisconnected", handler);
    return () => this.device.removeEventListener("gattserverdisconnected", handler);
  }

  disconnect(): void {
    this.device.gatt?.disconnect();
  }

  /** Sends raw ESC/POS bytes, chunked to stay under the device's write limits. */
  async write(data: Uint8Array): Promise<void> {
    const withResponse = this.characteristic.properties.write;
    for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
      // Re-wrapped so its backing buffer is a plain ArrayBuffer, not the
      // ArrayBufferLike a subarray() view carries — that's what BufferSource wants.
      const chunk = new Uint8Array(data.subarray(offset, offset + CHUNK_SIZE));
      if (withResponse) {
        await this.characteristic.writeValueWithResponse(chunk);
      } else {
        await this.characteristic.writeValueWithoutResponse(chunk);
      }
      if (offset + CHUNK_SIZE < data.length) await sleep(CHUNK_DELAY_MS);
    }
  }
}
