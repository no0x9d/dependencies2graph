import * as fs from 'fs';

export function write(pOutputTo, pContent) {
  if ("-" === pOutputTo) {
    writeToStdOut(pContent, 512);
  } else {
    writeToFile(pOutputTo, pContent);
  }
};

function writeToStdOut(pString, pBufferSize = 512) {
  const lNumberOfChunks = Math.ceil(pString.length / pBufferSize);

  for (let i = 0; i < lNumberOfChunks; i++) {
    process.stdout.write(pString.substr(i * pBufferSize, pBufferSize));
  }

}

function writeToFile(pOutputTo, pDependencyString) {
  try {
    fs.writeFileSync(
      pOutputTo,
      pDependencyString,
      {encoding: "utf8", flag: "w"}
    );
  } catch (e) {
    process.stderr.write(`ERROR: Writing to '${pOutputTo}' didn't work. ${e}`);
  }
}
