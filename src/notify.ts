import got from 'got'
import IVulnerabilityCount from "./models/IVulnerabilityCount"


const handleSlack = async (image: string, component: string, environment: string,  newVulnerabilities: IVulnerabilityCount) =>{
    if(process.env.SLACK_TOKEN && process.env.SLACK_TOKEN !== '') {
        console.log(newVulnerabilities, process.env.SLACK_TOKEN)
        try{
            const json = {
                "blocks": [
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": `${image}`,
                            "emoji": true,
                        },
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `*New Vulnerabilities in ${component} found in ${environment}*`,
                        },
                    },
                    {
                        "type": "section",
                        "fields": [
                            {
                                "type": "mrkdwn",
                                "text": `*Critical:*\n${newVulnerabilities.Critical}`,
                            },
                            {
                                "type": "mrkdwn",
                                "text": `*High:*\n${newVulnerabilities.High}`,
                            },
                            {
                                "type": "mrkdwn",
                                "text": `*Medium:*\n${newVulnerabilities.Medium}`,
                            },
                            {
                                "type": "mrkdwn",
                                "text": `*Low:*\n${newVulnerabilities.Low}`,
                            },
                            {
                                "type": "mrkdwn",
                                "text": `*Unknown:*\n${newVulnerabilities.Unknown}`,
                            },
                        ],
                    },
                ],
            }
            const test = await got.post(`https://hooks.slack.com/services/${process.env.SLACK_TOKEN}`, {json}).json()
            console.log(test, json)
        }
        catch(e) {
            console.error(e)
        }
    }
}


export const notify = async (image: string, component: string, environment: string, newVulnerabilities: IVulnerabilityCount) =>{
    // @ts-ignore
    if(["Critical", "High", "Medium", "Low", "Unknown"].some((x)=> newVulnerabilities[x] > 0)) {
    // new vulnerabilities available
        await handleSlack(image, component, environment, newVulnerabilities)
    }
}
