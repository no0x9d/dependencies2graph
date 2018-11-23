import {DependencyCruiserOutputFormatV3, DependencyCruiserOutputFormatV4} from '../typings/dependency-cruiser';
import * as fs from "fs";

export function readData(filename: string | undefined): Promise<DependencyCruiserOutputFormatV3 | DependencyCruiserOutputFormatV4> {
  let inputPromise =  filename ? readFromFile(filename) : readFromStdin();
  return inputPromise
    .then(parseJson)
}

function parseJson(inputJson: string): any {
  try {
    return JSON.parse(inputJson);
  } catch (e) {
    throw 'ERROR: Could not parse input as Json';
  }
}

function readFromStdin(): Promise<string> {
  console.log("Read input from stdin. If this is not what you wanted try 'dependencies2graph --help'");
  return new Promise<string>((resolve) => {
    const stdin = process.stdin;
    const inputChunks: string[] = [];
    stdin.resume();
    stdin.setEncoding('utf8');

    stdin.on('data', function(chunk) {
      inputChunks.push(chunk);
    });

    stdin.on('end', function() {
      const inputJSON = inputChunks.join('');
      resolve(inputJSON);
    })
  });
}

function readFromFile(filename: string): Promise<string> {
  return Promise.resolve(fs.readFileSync(filename, 'utf8'))
}
