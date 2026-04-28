export type DemoReviewStatus = 'pending' | 'approved' | 'changes_requested' | 'commented'

export interface DemoReviewFile {
  path: string
  additions: number
  deletions: number
  status: DemoReviewStatus
  reviewers: string[]
  summary: string
}

export interface DemoReviewSection {
  title: string
  description: string
  files: DemoReviewFile[]
}
