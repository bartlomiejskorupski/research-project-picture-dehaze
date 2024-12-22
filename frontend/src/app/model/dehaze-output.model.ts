export interface DehazeOutput {
  dehazed: string;
  region?: string;
  refinedRegion?: string;
  transmission?: string;
  atmosphericLight?: string;
}
