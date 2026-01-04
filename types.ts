export enum CustomerType {
  WALK_IN = 'Walk-in',
  RESERVED = 'Reserved',
}

export enum ServiceType {
  HIGH_COUNTER = 'High Counter (Short)',
  LOW_COUNTER = 'Low Counter (Long)',
}

export enum Sentiment {
  HAPPY = 'Happy',
  NEUTRAL = 'Neutral',
  ANGRY = 'Angry',
}

export interface SimulationConfig {
  durationMinutes: number;
  arrivalRatePerHour: number; // Lambda for exponential distribution
  percentReserved: number; // 0-100
  percentHighCounterTasks: number; // 0-100 (Traffic split)
  
  highCounter: {
    count: number;
    serviceMin: number;
    serviceMode: number;
    serviceMax: number;
  };
  
  lowCounter: {
    count: number;
    serviceMin: number;
    serviceMode: number;
    serviceMax: number;
  };
}

export interface Customer {
  id: number;
  type: CustomerType;
  serviceType: ServiceType;
  arrivalTime: number;
  serviceStartTime: number | null;
  serviceEndTime: number | null;
  tellerId: number | null;
  waitTime: number;
  serviceTime: number;
  sentiment: Sentiment;
}

export interface TellerMetric {
  id: number;
  label: string;
  servedCount: number;
  busyTime: number;
  idleTime: number;
  utilization: number;
}

export interface SimulationResult {
  customers: Customer[];
  events: SimulationEvent[];
  config: SimulationConfig;
  metrics: {
    avgWaitTime: number;
    maxWaitTime: number;
    avgQueueLengthHigh: number;
    avgQueueLengthLow: number;
    maxQueueLengthHigh: number;
    maxQueueLengthLow: number;
    avgWaitTimeWalkIn: number;
    avgWaitTimeReserved: number;
    throughput: number;
    tellerStats: {
      high: TellerMetric[];
      low: TellerMetric[];
    };
    sentimentStats: {
      happy: number;
      neutral: number;
      angry: number;
    };
  };
}

export interface SimulationEvent {
  time: number;
  type: 'ARRIVAL' | 'SERVICE_START' | 'SERVICE_END';
  customerId: number;
  details?: string;
}

export interface Snapshot {
  time: number;
  customersInQueueHigh: Customer[];
  customersInQueueLow: Customer[];
  customersAtTellerHigh: (Customer | null)[]; // Index maps to teller ID
  customersAtTellerLow: (Customer | null)[];
  finishedCount: number;
}