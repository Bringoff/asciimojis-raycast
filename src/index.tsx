import { ActionPanel, Action, List, showToast, Toast, closeMainWindow, popToRoot } from "@raycast/api";
import { useState, useEffect, useRef, useCallback } from "react";

import AsciiEmojis from "./asciimoji.js";

export default function Command() {
  const { state, search } = useSearch();

  return (
    <List isLoading={state.isLoading} onSearchTextChange={search} searchBarPlaceholder="Search emojis...">
      <List.Section title="Results" subtitle={state.results.length + ""}>
        {state.results.map((searchResult) => (
          <SearchListItem key={searchResult.name} searchResult={searchResult} />
        ))}
      </List.Section>
    </List>
  );
}

function SearchListItem({ searchResult }: { searchResult: SearchResult }) {
  return (
    <List.Item
      title={searchResult.asciimoji}
      accessoryTitle={searchResult.name}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Paste
              title="Paste in Active App"
              content={searchResult.asciimoji}
              onPaste={() => {
                closeMainWindow();
                popToRoot();
              }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.CopyToClipboard
              title="Copy to Clipboard"
              content={searchResult.asciimoji}
              onCopy={() => {
                closeMainWindow();
                popToRoot();
              }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function useSearch() {
  const [state, setState] = useState<SearchState>({ results: [], isLoading: true });
  const cancelRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async function search(searchText: string) {
      cancelRef.current?.abort();
      cancelRef.current = new AbortController();
      setState((oldState) => ({
        ...oldState,
        isLoading: true,
      }));
      try {
        const results = await performSearch(searchText, cancelRef.current.signal);
        setState((oldState) => ({
          ...oldState,
          results: results,
          isLoading: false,
        }));
      } catch (error) {
        setState((oldState) => ({
          ...oldState,
          isLoading: false,
        }));

        console.error("search error", error);
        showToast({ style: Toast.Style.Failure, title: "Could not perform search", message: String(error) });
      }
    },
    [cancelRef, setState]
  );

  useEffect(() => {
    search("");
    return () => {
      cancelRef.current?.abort();
    };
  }, []);

  return {
    state: state,
    search: search,
  };
}

async function performSearch(searchText: string, signal: AbortSignal): Promise<SearchResult[]> {
  const filteredEmojis = AsciiEmojis.getKeywords().filter((keyword) =>
    keyword.includes(searchText.trim().toLowerCase())
  );

  return filteredEmojis.map((keyword) => {
    return {
      name: keyword,
      asciimoji: AsciiEmojis.asciiEmojis[keyword],
    };
  });
}

interface SearchState {
  results: SearchResult[];
  isLoading: boolean;
}

interface SearchResult {
  name: string;
  asciimoji: string;
}
