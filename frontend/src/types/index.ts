// These are the TypeScript types that describe the shape of data

// Represents a single word with its importance score and topic group
export interface WordData {
  word: string;
  weight: number;
  topic: number;  
}
// The full response we get back from the backend after analyzing an article
export interface AnalyzeResponse {
  words: WordData[];      // list of all keywords with weights and topics
  topics: string[][];     // list of topic groups, each group is a list of words
  article_title: string;  // the title of the article
}
// The request we send to the backend(URL of the article)
export interface AnalyzeRequest {
  url: string;
}