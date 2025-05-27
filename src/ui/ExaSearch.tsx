import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import Exa from "exa-js";
import * as logger from "../logger.mts";
import TextInput from "./TextInput.tsx";

interface SearchResult {
  id: string;
  url: string;
  title: string;
  text?: string;
  publishedDate?: string;
  score?: number;
}

const ExaSearch: React.FC = () => {
  const [submittedQuery, setSubmittedQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exa, setExa] = useState<Exa | null>(null);

  useEffect(() => {
    const apiKey = process.env.EXA_API_KEY;
    if (apiKey) {
      setExa(new Exa(apiKey));
    } else {
      logger.error("EXA_API_KEY environment variable not found");
    }
  }, []);

  useEffect(() => {
    if (!submittedQuery || !exa) {
      setResults([]);
      setLoading(false);
      if (!submittedQuery) setError(null);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the correct API method and options format from the documentation
        const response = await exa.searchAndContents(submittedQuery, {
          text: { maxCharacters: 1000 },
          numResults: 5,
        });

        // The response is a SearchResponse object with a results array
        if (response && response.results && Array.isArray(response.results)) {
          setResults(response.results);
        } else {
          setResults([]);
        }
      } catch (err) {
        logger.error("Error fetching Exa search results:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [submittedQuery, exa]);

  const handleQuerySubmit = (text: string) => {
    if (text.trim() === "") return;
    setSubmittedQuery(text);
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      padding={1}
      width="100%"
    >
      <Text>Search with Exa:</Text>
      <TextInput callback={handleQuerySubmit} />

      {loading && <Text>Loading search results for "{submittedQuery}"...</Text>}
      {error && <Text color="red">Error: {error}</Text>}

      {!loading && !error && submittedQuery && results.length === 0 && (
        <Text>No results found for "{submittedQuery}".</Text>
      )}

      {!loading && !error && results.length > 0 && (
        <Box flexDirection="column">
          <Text bold>
            Search Results for: "{submittedQuery}" ({results.length})
          </Text>
          {results.map((item, index) => (
            <Box
              key={item.id || item.url || `exa-result-${index}`}
              flexDirection="column"
              borderBottom={1}
              borderColor="blue"
              marginY={1}
            >
              <Text>{item.title || "N/A"}</Text>
              <Text>{item.url || "N/A"}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ExaSearch;

// <Text wrap="truncate-end">
//   {item.text
//     ? item.text.substring(0, 300) +
//       (item.text.length > 300 ? "..." : "")
//     : "N/A"}
// </Text>
