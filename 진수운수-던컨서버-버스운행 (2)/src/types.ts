export interface Knight {
  id: number;
  name: string;
  job: string;
  power: number;
  relayCount: number;
  status: 'waiting' | 'in-party' | 'off-duty';
}

export interface Client {
  id: number;
  name: string;
  job: string;
  power: number;
  notes: string;
  status: 'waiting' | 'in-party' | 'completed';
}

export interface Party {
  id: number;
  knights: Knight[];
  clients: Client[];
  isCompleted: boolean;
}