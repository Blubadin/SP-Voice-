/**
 * Real Microphone Device Discovery & Management
 * Uses browser MediaDevices API:
 * - navigator.mediaDevices.enumerateDevices()
 * - navigator.mediaDevices.getUserMedia()
 * - navigator.mediaDevices.ondevicechange
 *
 * NEVER invents fake device names.
 */

export interface DiscoveredAudioDevice {
  deviceId: string;
  label: string;
  groupId?: string;
  isDefault: boolean;
}

export type DeviceConnectionStatus = 'connected' | 'unavailable' | 'disconnected' | 'permission_needed';

export type DeviceChangeCallback = (devices: DiscoveredAudioDevice[]) => void;
export type DeviceStatusCallback = (status: DeviceConnectionStatus, activeDevice?: DiscoveredAudioDevice) => void;

class AudioDeviceManager {
  private devices: DiscoveredAudioDevice[] = [];
  private selectedDeviceId: string = 'default';
  private selectedDeviceLabel: string = 'Default Microphone';
  private status: DeviceConnectionStatus = 'permission_needed';
  private deviceChangeCallbacks: Set<DeviceChangeCallback> = new Set();
  private statusCallbacks: Set<DeviceStatusCallback> = new Set();
  private hasRequestedPermission = false;

  constructor() {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      this.initListeners();
    }
  }

  private initListeners() {
    // Listen for real hardware changes (plugging in USB mic, connecting AirPods, etc.)
    const onDeviceChangeHandler = () => {
      this.refreshDevices();
    };

    if (navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', onDeviceChangeHandler);
    } else {
      navigator.mediaDevices.ondevicechange = onDeviceChangeHandler;
    }

    // Initial check (labels might be empty until permission granted)
    this.refreshDevices(false);
  }

  /**
   * Request microphone permission from the user so browser exposes actual device labels.
   */
  public async requestPermissionAndDiscover(): Promise<{
    granted: boolean;
    devices: DiscoveredAudioDevice[];
    error?: string;
  }> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.status = 'unavailable';
      this.notifyStatus();
      return { granted: false, devices: [], error: 'MediaDevices API not supported in this browser' };
    }

    try {
      // Temporary stream to acquire permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.hasRequestedPermission = true;

      // Stop initial track immediately so microphone indicator turns off
      stream.getTracks().forEach((track) => track.stop());

      // Now enumerate with real labels!
      const devices = await this.refreshDevices(true);
      return { granted: true, devices };
    } catch (err: any) {
      console.warn('[AudioDeviceManager] Permission request error:', err.message);
      this.status = 'unavailable';
      this.notifyStatus();
      return {
        granted: false,
        devices: this.devices,
        error: err.name === 'NotAllowedError' ? 'Microphone permission denied' : err.message,
      };
    }
  }

  /**
   * Enumerate real browser audio input devices.
   */
  public async refreshDevices(triggerPermissionIfEmpty = false): Promise<DiscoveredAudioDevice[]> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter((d) => d.kind === 'audioinput');

      // Check if labels are hidden
      const hasLabels = audioInputs.some((d) => d.label && d.label.trim().length > 0);
      if (!hasLabels && triggerPermissionIfEmpty && !this.hasRequestedPermission) {
        return (await this.requestPermissionAndDiscover()).devices;
      }

      const discovered: DiscoveredAudioDevice[] = audioInputs.map((d, index) => {
        let label = d.label;
        if (!label || !label.trim()) {
          label = index === 0 ? 'Default Microphone' : `Microphone ${index + 1}`;
        }
        return {
          deviceId: d.deviceId,
          label,
          groupId: d.groupId,
          isDefault: d.deviceId === 'default' || index === 0,
        };
      });

      this.devices = discovered;

      // Verify currently selected device still exists
      if (this.selectedDeviceId && this.selectedDeviceId !== 'default') {
        const stillExists = discovered.some((d) => d.deviceId === this.selectedDeviceId);
        if (!stillExists) {
          console.warn(`[AudioDeviceManager] Previously selected device (${this.selectedDeviceLabel}) disconnected.`);
          this.status = 'disconnected';
          // Fall back safely to default device
          if (discovered.length > 0) {
            this.selectedDeviceId = discovered[0].deviceId;
            this.selectedDeviceLabel = discovered[0].label;
          }
          this.notifyStatus();
        } else {
          this.status = 'connected';
          this.notifyStatus();
        }
      } else {
        if (discovered.length > 0) {
          this.status = 'connected';
          if (!this.selectedDeviceId || this.selectedDeviceId === 'default') {
            const def = discovered.find((d) => d.deviceId === 'default') || discovered[0];
            this.selectedDeviceId = def.deviceId;
            this.selectedDeviceLabel = def.label;
          }
        } else {
          this.status = 'unavailable';
        }
        this.notifyStatus();
      }

      this.notifyDevices();
      return discovered;
    } catch (err: any) {
      console.warn('[AudioDeviceManager] enumerateDevices failed:', err.message);
      return [];
    }
  }

  public getDevices(): DiscoveredAudioDevice[] {
    return this.devices;
  }

  public getSelectedDeviceId(): string {
    return this.selectedDeviceId;
  }

  public getSelectedDeviceLabel(): string {
    return this.selectedDeviceLabel;
  }

  public getStatus(): DeviceConnectionStatus {
    return this.status;
  }

  public selectDevice(deviceId: string) {
    const target = this.devices.find((d) => d.deviceId === deviceId);
    if (target) {
      this.selectedDeviceId = target.deviceId;
      this.selectedDeviceLabel = target.label;
      this.status = 'connected';
    } else if (deviceId === 'default') {
      this.selectedDeviceId = 'default';
      this.selectedDeviceLabel = 'Default Microphone';
      this.status = 'connected';
    }
    this.notifyStatus();
  }

  public onDeviceChange(cb: DeviceChangeCallback): () => void {
    this.deviceChangeCallbacks.add(cb);
    cb(this.devices);
    return () => this.deviceChangeCallbacks.delete(cb);
  }

  public onStatusChange(cb: DeviceStatusCallback): () => void {
    this.statusCallbacks.add(cb);
    const active = this.devices.find((d) => d.deviceId === this.selectedDeviceId);
    cb(this.status, active);
    return () => this.statusCallbacks.delete(cb);
  }

  private notifyDevices() {
    this.deviceChangeCallbacks.forEach((cb) => cb(this.devices));
  }

  private notifyStatus() {
    const active = this.devices.find((d) => d.deviceId === this.selectedDeviceId);
    this.statusCallbacks.forEach((cb) => cb(this.status, active));
  }
}

export const audioDeviceManager = new AudioDeviceManager();
