import IVulnerability from "./models/IVulnerability"
import got from 'got'
import {URLSearchParams} from "url"
import IGitlabIssue from "./models/IGitlabIssue"
const severityToWeight = {
    "Unknown": "0",
    "Low": "1",
    "Medium":"2",
    "High":"3",
    "Critical":"4",
}
const projectUrl = `${process.env.CI_API_V4_URL}/projects/${process.env.CI_PROJECT_ID}`
const issueAlreadyExists  = async (vulnerability: IVulnerability, component: string, environment: string):Promise<boolean> => {
    const token = process.env.ISSUE_ACCESS_TOKEN
    const searchParams = new URLSearchParams()
    searchParams.set("labels", `${vulnerability.cve},${environment},${component},${vulnerability.severity}`)
    searchParams.set("state", "opened")
    const result:IGitlabIssue[] = await got.get(`${projectUrl}/issues`, {
        searchParams: searchParams,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).json()

    return result.length > 0
}
const createIssue = async (image: string, component: string, environment: string, vulnerability: IVulnerability) => {
    const token = process.env.ISSUE_ACCESS_TOKEN
    const searchParams = new URLSearchParams()
    searchParams.set("labels", `${vulnerability.cve},${environment},${component},${vulnerability.severity}`)
    searchParams.set("confidential", "true")
    searchParams.set("weight", severityToWeight[vulnerability.severity])
    searchParams.set("title", `${environment} - ${component} - ${vulnerability.severity} - ${vulnerability.cve}`)
    const urls = vulnerability.identifiers.reduce((acc, val)=>acc+" <br /> "+val.url, "")
    searchParams.set("description", ` Solution: ${vulnerability.solution} <br /> ${vulnerability.description} <br /> ${urls}`)
    // console.log('env',process.env.CI_PROJECT_URL, token)
    await got.post(`${projectUrl}/issues`, {
        searchParams: searchParams,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).json()
    console.log(vulnerability.cve, 'issue created')
}


export const handleVulnerability = async (image: string, component: string, environment: string, vulnerability: IVulnerability):Promise<null|"Unknown"|"Low"|"Medium"|"High"|"Critical"> =>  {
    const exists =  await issueAlreadyExists(vulnerability, component, environment)
    if(exists) {
        console.log(vulnerability.cve, 'already present')
        return null
    }
    // now create new issue
    await createIssue(image, component, environment, vulnerability)
    return vulnerability.severity
}

export const getOpenedGitlabIssues = async(component: string, environment: string):Promise<IGitlabIssue[]> => {
    const token = process.env.ISSUE_ACCESS_TOKEN
    const searchParams = new URLSearchParams()
    searchParams.set("labels", `${environment},${component}`)
    searchParams.set("state", "opened")
    const result:IGitlabIssue[] = await got.get(`${projectUrl}/issues`, {
        searchParams: searchParams,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).json()
    return result
}

export const closeResolvedVulnerabilities = async(component: string, environment: string, vulnerabilities: IVulnerability[]) => {
    const issues = await getOpenedGitlabIssues(component, environment)
    const resolvedIssues = issues
        .filter(issue=>issue.labels.includes(component)&&issue.labels.includes(environment))
        .filter((issue)=> !vulnerabilities.some(x=>issue.labels.includes(x.cve)))
    const searchParams = new URLSearchParams()
    // searchParams.set("labels", `${vulnerability.cve},${environment},${component},${vulnerability.severity}`)
    searchParams.set("state_event", "close")

    for(const resolvedIssue of resolvedIssues) {
        console.log('issue resolved', resolvedIssue.title, resolvedIssue.labels)
        await got.put(`${projectUrl}/issues/${resolvedIssue.iid}`, {
            searchParams: searchParams,
            headers: {
                Authorization: `Bearer ${process.env.ISSUE_ACCESS_TOKEN}`,
            },
        }).json()
    }
}
