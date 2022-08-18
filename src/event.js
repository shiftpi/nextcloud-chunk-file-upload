class Event {
  constructor(filename, chunkNo, message = null, complete = false, axiosResponse = null) {
    this.filename = filename;
    this.chunkNo = chunkNo;
    this.message = message;
    this.complete = complete;
    this.httpErrorCode = axiosResponse?.status ?? null;
    this.httpErrorMessage = axiosResponse?.data ?? null;
  }

  toString() {
    return `${this.filename} (chunk ${this.chunkNo}, complete = ${this.complete}): ${this.message || '<No message>'}`;
  }
}

module.exports = Event;
