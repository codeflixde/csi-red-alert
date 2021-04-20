import IVulnerability from "./IVulnerability"

export default interface ITrivyResult {
  version: string,
  vulnerabilities: IVulnerability[]
}
