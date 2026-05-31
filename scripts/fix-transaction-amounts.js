import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function fixTransactionAmounts(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  let fixed = content
  let count = 0

  const regex = /type: 'consume',\s*\n\s*amount: (\d+(\.\d+)?)/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const amount = parseFloat(match[1])
    if (amount > 0) {
      const oldStr = match[0]
      const newStr = oldStr.replace(`amount: ${match[1]}`, `amount: -${match[1]}`)
      fixed = fixed.replace(oldStr, newStr)
      count++
      console.log(`  Fixed consume amount: ${match[1]} -> -${match[1]}`)
    }
  }

  if (count > 0) {
    fs.writeFileSync(filePath, fixed, 'utf8')
    console.log(`Fixed ${count} transactions in ${path.basename(filePath)}`)
  } else {
    console.log(`No changes needed in ${path.basename(filePath)}`)
  }
  return count
}

console.log('Fixing transaction amounts...')
console.log('')

const files = [
  path.join(__dirname, '../data/prepaid.ts'),
  path.join(__dirname, '../data/demo-prepaid.ts')
]

let total = 0
files.forEach(file => {
  total += fixTransactionAmounts(file)
})

console.log('')
console.log(`Total fixed: ${total} transactions`)
