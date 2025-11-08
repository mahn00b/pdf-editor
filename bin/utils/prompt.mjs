import readline from "node:readline";

/**
 * Creates a readline interface for CLI input
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Ask a simple text question
 * @param {string} question
 * @returns {Promise<string>}
 */
export async function ask(question) {
  const rl = createInterface();
  return new Promise((resolve) => {
    rl.question(`\x1b[36m${question}\x1b[0m `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Ask a yes/no question
 * @param {string} question
 * @param {boolean} [defaultYes=false]
 * @returns {Promise<boolean>}
 */
export async function confirm(question, defaultYes = false) {
  const suffix = defaultYes ? " [Y/n] " : " [y/N] ";
  const answer = await ask(question + suffix);
  if (!answer) return defaultYes;
  return /^y(es)?$/i.test(answer);
}

/**
 * Ask a multiple-choice question
 * @param {string} question
 * @param {string[]} choices
 * @returns {Promise<string>}
 */
export async function select(question, choices) {
  console.log(`\x1b[36m${question}\x1b[0m`);
  choices.forEach((choice, idx) => {
    console.log(`  ${idx + 1}. ${choice}`);
  });

  while (true) {
    const answer = await ask("Select an option (1-" + choices.length + "):");
    const index = parseInt(answer, 10) - 1;
    if (!Number.isNaN(index) && index >= 0 && index < choices.length) {
      return choices[index];
    }
    console.log("\x1b[31mInvalid choice. Please try again.\x1b[0m");
  }
}
