import IVulnerability from "./IVulnerability"

export default interface IGitlabIssue {
  id: number,
  iid: number,
  project_id: number,
  title: string,
  description: string,
  state: "closed"|"opened",
  created_at: string,
  updated_at: string,
  closed_at: string,
  labels: string[],

}
