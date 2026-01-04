import { 
  SimulationConfig, 
  Customer, 
  SimulationResult, 
  SimulationEvent, 
  CustomerType, 
  ServiceType,
  TellerMetric,
  Sentiment
} from '../types';
import { randomExponential, randomTriangular } from '../utils/math';

export class BankSimulator {
  private config: SimulationConfig;
  private currentTime: number = 0;
  private customers: Customer[] = [];
  private events: SimulationEvent[] = [];

  constructor(config: SimulationConfig) {
    this.config = config;
  }

  public run(): SimulationResult {
    this.reset();
    this.generateArrivals();
    this.processEvents();
    return this.calculateMetrics();
  }

  private reset() {
    this.currentTime = 0;
    this.customers = [];
    this.events = [];
  }

  private generateArrivals() {
    let time = 0;
    let idCounter = 1;
    const lambda = this.config.arrivalRatePerHour / 60; // Arrivals per minute

    while (time < this.config.durationMinutes) {
      // Inter-arrival time (Exponential)
      const interArrival = randomExponential(lambda);
      time += interArrival;

      if (time > this.config.durationMinutes) break;

      const isReserved = Math.random() * 100 < this.config.percentReserved;
      const isHighCounter = Math.random() * 100 < this.config.percentHighCounterTasks;

      const serviceDuration = isHighCounter
        ? randomTriangular(
            this.config.highCounter.serviceMin,
            this.config.highCounter.serviceMax,
            this.config.highCounter.serviceMode
          )
        : randomTriangular(
            this.config.lowCounter.serviceMin,
            this.config.lowCounter.serviceMax,
            this.config.lowCounter.serviceMode
          );

      this.customers.push({
        id: idCounter++,
        type: isReserved ? CustomerType.RESERVED : CustomerType.WALK_IN,
        serviceType: isHighCounter ? ServiceType.HIGH_COUNTER : ServiceType.LOW_COUNTER,
        arrivalTime: time,
        serviceStartTime: null,
        serviceEndTime: null,
        tellerId: null,
        waitTime: 0,
        serviceTime: serviceDuration,
        sentiment: Sentiment.HAPPY // Default
      });

      this.events.push({
        time: time,
        type: 'ARRIVAL',
        customerId: idCounter - 1,
      });
    }
  }

  private processEvents() {
    // Tellers state: when will they be free?
    // High counters
    const highTellersFreeAt = new Array(this.config.highCounter.count).fill(0);
    // Low counters
    const lowTellersFreeAt = new Array(this.config.lowCounter.count).fill(0);

    // Sort customers by arrival time (should be sorted already, but safety first)
    this.customers.sort((a, b) => a.arrivalTime - b.arrivalTime);

    // Separation into queues for processing
    this.simulateQueue(
      this.customers.filter(c => c.serviceType === ServiceType.HIGH_COUNTER),
      highTellersFreeAt
    );
    
    this.simulateQueue(
      this.customers.filter(c => c.serviceType === ServiceType.LOW_COUNTER),
      lowTellersFreeAt
    );
    
    // Merge and sort all events for the timeline
    this.events.sort((a, b) => a.time - b.time);
  }

  private simulateQueue(queueCustomers: Customer[], tellersFreeAt: number[]) {
    interface QueueEvent {
      time: number;
      type: 'ARRIVAL' | 'TELLER_FREE';
      customerId?: number; // For Arrival
      tellerIndex?: number; // For Teller Free
    }

    const pq: QueueEvent[] = [];
    
    // Add all arrivals
    queueCustomers.forEach(c => {
      pq.push({ time: c.arrivalTime, type: 'ARRIVAL', customerId: c.id });
    });

    // Sort initial PQ
    pq.sort((a, b) => a.time - b.time);

    const waitingBuffer: Customer[] = [];
    
    // Helper to pick next customer from buffer
    const popNextCustomer = (): Customer | undefined => {
      if (waitingBuffer.length === 0) return undefined;
      // Find first RESERVED
      const reservedIdx = waitingBuffer.findIndex(c => c.type === CustomerType.RESERVED);
      if (reservedIdx !== -1) {
        return waitingBuffer.splice(reservedIdx, 1)[0];
      }
      // Else take first (FIFO for Walk-ins)
      return waitingBuffer.shift();
    };

    while (pq.length > 0) {
      // Sort PQ by time. If times are equal, process TELLER_FREE before ARRIVAL to maximize throughput
      pq.sort((a, b) => {
        if (Math.abs(a.time - b.time) < 0.0001) {
           return a.type === 'TELLER_FREE' ? -1 : 1; 
        }
        return a.time - b.time;
      });

      const event = pq.shift()!;
      const currentTime = event.time;

      if (event.type === 'ARRIVAL') {
        const customer = queueCustomers.find(c => c.id === event.customerId)!;
        
        // Try to assign to free teller
        let assigned = false;
        // Sort tellers by who is free soonest (actually we just check if any is free <= currentTime)
        // We want the teller with smallest freeAt that is <= currentTime.
        let bestTellerIdx = -1;
        
        for (let i = 0; i < tellersFreeAt.length; i++) {
          if (tellersFreeAt[i] <= currentTime) {
            bestTellerIdx = i;
            break; 
          }
        }

        if (bestTellerIdx !== -1) {
          // Start Service
          this.assignService(customer, bestTellerIdx, currentTime, tellersFreeAt, pq);
        } else {
          // Wait
          waitingBuffer.push(customer);
        }
      } else if (event.type === 'TELLER_FREE') {
        const tellerIdx = event.tellerIndex!;
        
        // Teller is free. Is there anyone waiting?
        const nextCustomer = popNextCustomer();
        if (nextCustomer) {
           // Determine start time. It's max(arrival, tellerFree). 
           // Since this event is TELLER_FREE at time X, and customer is in buffer (arrived < X), start is X.
           this.assignService(nextCustomer, tellerIdx, currentTime, tellersFreeAt, pq);
        }
      }
    }
  }

  private assignService(
    customer: Customer, 
    tellerIdx: number, 
    startTime: number, 
    tellersFreeAt: number[], 
    pq: any[]
  ) {
    customer.serviceStartTime = startTime;
    customer.serviceEndTime = startTime + customer.serviceTime;
    customer.waitTime = startTime - customer.arrivalTime;
    customer.tellerId = tellerIdx;
    
    // Assign Sentiment
    if (customer.waitTime > 15) {
      customer.sentiment = Sentiment.ANGRY;
    } else if (customer.waitTime > 5) {
      customer.sentiment = Sentiment.NEUTRAL;
    } else {
      customer.sentiment = Sentiment.HAPPY;
    }

    // Update teller
    tellersFreeAt[tellerIdx] = customer.serviceEndTime;

    // Add Events to main list
    this.events.push({
      time: customer.serviceStartTime,
      type: 'SERVICE_START',
      customerId: customer.id,
      details: `Teller ${tellerIdx + 1}`
    });

    this.events.push({
      time: customer.serviceEndTime,
      type: 'SERVICE_END',
      customerId: customer.id
    });

    // Add Internal Queue Event so teller picks up next person
    pq.push({
      time: customer.serviceEndTime,
      type: 'TELLER_FREE',
      tellerIndex: tellerIdx
    });
  }

  private calculateMetrics(): SimulationResult {
    // Basic stats
    const finished = this.customers.filter(c => c.serviceEndTime !== null);
    
    const waitTimes = finished.map(c => c.waitTime);
    const avgWaitTime = waitTimes.reduce((a, b) => a + b, 0) / (finished.length || 1);
    const maxWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;
    
    const walkIns = finished.filter(c => c.type === CustomerType.WALK_IN);
    const reserved = finished.filter(c => c.type === CustomerType.RESERVED);
    
    const avgWaitWalkIn = walkIns.reduce((a, b) => a + b.waitTime, 0) / (walkIns.length || 1);
    const avgWaitReserved = reserved.reduce((a, b) => a + b.waitTime, 0) / (reserved.length || 1);

    // Sentiment Stats
    const happy = finished.filter(c => c.sentiment === Sentiment.HAPPY).length;
    const neutral = finished.filter(c => c.sentiment === Sentiment.NEUTRAL).length;
    const angry = finished.filter(c => c.sentiment === Sentiment.ANGRY).length;

    // Teller Statistics
    const createTellerStats = (count: number, type: ServiceType, labelPrefix: string): TellerMetric[] => {
      return Array.from({ length: count }, (_, i) => {
        const myCustomers = finished.filter(c => c.serviceType === type && c.tellerId === i);
        const busyTime = myCustomers.reduce((acc, c) => acc + c.serviceTime, 0);
        const idleTime = Math.max(0, this.config.durationMinutes - busyTime);
        const utilization = Math.min(1, busyTime / this.config.durationMinutes);
        
        return {
          id: i,
          label: `${labelPrefix} ${i + 1}`,
          servedCount: myCustomers.length,
          busyTime,
          idleTime,
          utilization
        };
      });
    };

    const highStats = createTellerStats(this.config.highCounter.count, ServiceType.HIGH_COUNTER, 'High');
    const lowStats = createTellerStats(this.config.lowCounter.count, ServiceType.LOW_COUNTER, 'Low');

    return {
      customers: this.customers,
      events: this.events,
      config: this.config,
      metrics: {
        avgWaitTime,
        maxWaitTime,
        avgQueueLengthHigh: 0, 
        avgQueueLengthLow: 0,
        maxQueueLengthHigh: 0,
        maxQueueLengthLow: 0,
        avgWaitTimeWalkIn: avgWaitWalkIn,
        avgWaitTimeReserved: avgWaitReserved,
        throughput: finished.length,
        tellerStats: {
          high: highStats,
          low: lowStats
        },
        sentimentStats: {
          happy,
          neutral,
          angry
        }
      }
    };
  }
}

/**
 * Helper to get the state of the world at a specific time t
 */
import { Snapshot } from '../types';

export const getSnapshotAtTime = (result: SimulationResult, time: number): Snapshot => {
  const customers = result.customers;
  
  // Who is in queue? Arrived <= time AND ServiceStart > time (or null)
  const inQueueHigh = customers.filter(c => 
    c.serviceType === ServiceType.HIGH_COUNTER && 
    c.arrivalTime <= time && 
    (c.serviceStartTime === null || c.serviceStartTime > time)
  ).sort((a,b) => a.arrivalTime - b.arrivalTime); // FIFO visual, though logic priority handles selection

  const inQueueLow = customers.filter(c => 
    c.serviceType === ServiceType.LOW_COUNTER && 
    c.arrivalTime <= time && 
    (c.serviceStartTime === null || c.serviceStartTime > time)
  ).sort((a,b) => a.arrivalTime - b.arrivalTime);

  // Who is being served? ServiceStart <= time AND ServiceEnd > time
  const atTellerHigh = new Array(result.config.highCounter.count).fill(null);
  const atTellerLow = new Array(result.config.lowCounter.count).fill(null);

  customers.forEach(c => {
    if (c.serviceStartTime !== null && c.serviceStartTime <= time && 
       (c.serviceEndTime === null || c.serviceEndTime > time)) {
       // Currently at teller
       if (c.serviceType === ServiceType.HIGH_COUNTER) {
         if (c.tellerId !== null && c.tellerId < atTellerHigh.length) {
            atTellerHigh[c.tellerId] = c;
         }
       } else {
         if (c.tellerId !== null && c.tellerId < atTellerLow.length) {
            atTellerLow[c.tellerId] = c;
         }
       }
    }
  });

  const finishedCount = customers.filter(c => c.serviceEndTime !== null && c.serviceEndTime <= time).length;

  return {
    time,
    customersInQueueHigh: inQueueHigh,
    customersInQueueLow: inQueueLow,
    customersAtTellerHigh: atTellerHigh,
    customersAtTellerLow: atTellerLow,
    finishedCount
  };
};