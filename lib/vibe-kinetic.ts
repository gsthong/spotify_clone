/**
 * Vibe Kinetic Engine
 * Low-level audio analysis for BPM detection and rhythmic synchronization.
 */

export interface BeatData {
  isBeat: boolean;
  bpm: number;
  energy: number;
  confidence: number;
}

export class VibeKinetic {
  private sampleRate: number;
  private peakHistory: number[] = [];
  private lastPeakTime: number = 0;
  private bpm: number = 120; // Default tempo
  private energy: number = 0;
  private confidence: number = 0;
  
  // Smoothing factors
  private readonly BPM_SMOOTHING = 0.95;
  private readonly ENERGY_SMOOTHING = 0.8;
  private readonly MIN_THRESHOLD = 0.15;
  private readonly PEAK_DEBOUNCE_MS = 250; // Max BPM ~240

  constructor(sampleRate: number = 44100) {
    this.sampleRate = sampleRate;
  }

  /**
   * Processes a frequency buffer (low-passed) to detect beats and energy.
   * Expects time domain data for peak detection.
   */
  public analyze(timeData: Uint8Array, frequencyData: Uint8Array): BeatData {
    // 1. Calculate real-time energy (RMS-ish) from frequency data
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i];
    }
    const instantEnergy = (sum / frequencyData.length) / 255;
    this.energy = (this.energy * this.ENERGY_SMOOTHING) + (instantEnergy * (1 - this.ENERGY_SMOOTHING));

    // 2. Peak Detection (Beat detection)
    // We focus on the time domain data which should be low-passed elsewhere
    let isBeat = false;
    let maxVal = 0;
    for (let i = 0; i < timeData.length; i++) {
      const val = Math.abs(timeData[i] - 128) / 128;
      if (val > maxVal) maxVal = val;
    }

    const now = performance.now();
    if (maxVal > this.MIN_THRESHOLD && now - this.lastPeakTime > this.PEAK_DEBOUNCE_MS) {
      if (maxVal > this.energy * 1.2) { // Peak must be significantly higher than average energy
        isBeat = true;
        const interval = now - this.lastPeakTime;
        this.lastPeakTime = now;

        // Calculate potential BPM from interval
        if (interval > 300 && interval < 1500) {
          const instantBpm = 60000 / interval;
          
          // Basic outlier rejection
          if (Math.abs(instantBpm - this.bpm) < 40 || this.confidence < 0.3) {
            this.bpm = (this.bpm * this.BPM_SMOOTHING) + (instantBpm * (1 - this.BPM_SMOOTHING));
            this.confidence = Math.min(1, this.confidence + 0.1);
          } else {
            this.confidence = Math.max(0, this.confidence - 0.05);
          }
        }
      }
    }

    // Slowly decay confidence if no beats found
    if (now - this.lastPeakTime > 2000) {
      this.confidence = Math.max(0, this.confidence - 0.01);
    }

    return {
      isBeat,
      bpm: Math.round(this.bpm),
      energy: this.energy,
      confidence: this.confidence
    };
  }

  public getBpm(): number {
    return this.bpm;
  }

  public getEnergy(): number {
    return this.energy;
  }
}
