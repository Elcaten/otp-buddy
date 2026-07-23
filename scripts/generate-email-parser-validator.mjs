import fs from 'node:fs/promises';
import Ajv from 'ajv';
import standaloneCode from 'ajv/dist/standalone/index.js';

const schemaUrl = new URL('../source/email-parser/email-parser-config.schema.json', import.meta.url);
const outputUrl = new URL('../source/email-parser/email-parser-config.validator.js', import.meta.url);
const schema = JSON.parse(await fs.readFile(schemaUrl, 'utf8'));
const ajv = new Ajv({
  allErrors: true,
  code: {
    esm: true,
    source: true,
  },
});
const validate = ajv.compile(schema);
const output = `/* Generated from email-parser-config.schema.json. Do not edit by hand. */\n${standaloneCode(
  ajv,
  validate
)}`;

await fs.writeFile(outputUrl, output);
