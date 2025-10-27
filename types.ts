// Defines the structure for a cell in our schedule grid
export interface GridCell {
  instructor: string | null;
  rowspan: number;
  hidden: boolean;
}
