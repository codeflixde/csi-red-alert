import {ArgumentParser} from 'argparse'
import {readFileSync} from 'fs'
import ITrivyResult from "./models/ITrivyResult"
import {handleVulnerability} from "./gitlab"
import IVulnerabilityCount from "./models/IVulnerabilityCount"
import {notify} from "./notify";


(async () => {
    const parser = new ArgumentParser({
        description: "Add arguments for reporting",
    })
    parser.add_argument("-i", "--image", {type: String, help: 'provide identifier for image'})
    parser.add_argument("-c", "--component", {type: String, help: 'provide identifier for component'})
    parser.add_argument("-f", "--file", {type: String, help: 'enter trivy json filepath'})
    parser.add_argument("-e", "--environment", {type: String, help: 'add environment for scan'})
    const args = parser.parse_args()
    const vulnerabilityFile = readFileSync(args.file, 'utf8')
    const vulnerabilityList: ITrivyResult = JSON.parse(vulnerabilityFile)
    const newVulnerabilities: IVulnerabilityCount = {
        Unknown: 0,
        Low: 0,
        Medium: 0,
        High: 0,
        Critical: 0,
    }
    for (const vuln of vulnerabilityList.vulnerabilities) {
        if (vuln.solution !== "No solution provided") {// only issue which can be fixed!
            const severity = await handleVulnerability(args.image, args.component, args.environment, vuln)
            if (severity) {
                newVulnerabilities[severity] += 1
            }
        }
    }
    await notify(args.image, args.component, args.environment, newVulnerabilities)
    process.exit(0)
})()
