
export interface Milestone {
  id: string;
  title: string;
  description: string;
  deadline: string;
  estimatedHours: number;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'completed';
}

export interface ProjectBreakdown {
  id: string;
  projectName: string;
  totalEstimatedHours: number;
  milestones: Milestone[];
  isRealistic: boolean;
  feasibilityNote: string;
  deadline: string;
  completedMilestoneIds: string[];
  createdAt: number;
}

export interface AssignmentInput {
  text: string;
  file?: {
    data: string;
                mimeType: string;
    name: string;
  };
  deadline: string;
}
