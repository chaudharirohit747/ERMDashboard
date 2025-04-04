export interface Department {
  id?: string;
  name: string;
  description: string;
  manager?: string;
  employeeCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
