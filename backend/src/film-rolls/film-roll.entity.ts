export interface FilmRoll {
  id: string;
  rollNumber: string;
  customerName: string;
  customerPhone: string;
  filmType: 'color' | 'bw' | 'slide';
  filmBrand: string;
  iso: number;
  exposures: number;
  status: 'registered' | 'developing' | 'scanning' | 'completed' | 'problem';
  scanResolution?: string;
  deliveryVersion?: string;
  isMixed: boolean;
  mixedNote?: string;
  mixedWithRollNumber?: string;
  internalNotes?: string;
  registeredAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
