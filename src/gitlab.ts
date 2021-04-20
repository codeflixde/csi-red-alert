import IVulnerability from "./models/IVulnerability"
import got from 'got'
import {URLSearchParams} from "url"
const severityToWeight = {
    "Unknown": "0",
    "Low": "1",
    "Medium":"2",
    "High":"3",
    "Critical":"4",
}
const projectUrl = `${process.env.CI_API_V4_URL}/projects/${process.env.CI_PROJECT_ID}`
const issueAlreadyExists  = async (cve: string, environment: string):Promise<boolean> => {
    const token = process.env.ISSUE_ACCESS_TOKEN
    const searchParams = new URLSearchParams()
    searchParams.set("labels", `${cve},${environment}`)
    searchParams.set("state", "opened")
    const result:any[] = await got.get(`${projectUrl}/issues`, {
        searchParams: searchParams,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).json()

    return result.length > 0
}
const createIssue = async (image: string, environment: string, vulnerability: IVulnerability) => {
    const token = process.env.ISSUE_ACCESS_TOKEN
    const searchParams = new URLSearchParams()
    searchParams.set("labels", `${vulnerability.cve},${environment},${vulnerability.severity}`)
    searchParams.set("confidential", "true")
    searchParams.set("weight", severityToWeight[vulnerability.severity])
    searchParams.set("title", `${environment} - ${image} - ${vulnerability.severity} - ${vulnerability.cve}`)
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


export const handleVulnerability = async (image: string, component: string, environment: string, vulnerability: IVulnerability) =>  {
    const exists =  await issueAlreadyExists(vulnerability.cve, environment)
    if(exists) {
        console.log(vulnerability.cve, 'already present')
        return null
    }
    // now create new issue
    await createIssue(image, environment, vulnerability)
    return vulnerability.severity
}
