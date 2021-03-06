import React from "react";
import styled from "styled-components";
import { navigate } from "@reach/router";

import CSV from "../modules/CSV";
import useDebounce from "../hooks/useDebounce";
import { fetchPlayers } from "../modules/api";
import Header from "../components/Header";
import Main from "../components/Main";

const PlayerTable = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

const TableRow = styled.tr`
  color: white;
  transition: color 0.1s ease-in-out;
  cursor: pointer;

  :hover {
    color: rgba(249, 249, 249, 0.65);
  }

  @media only screen and (max-width: 600px) {
    border: 1px solid #ccc;
  }
`;

const TableCell = styled.td`
  border-bottom: solid 1px #1e1f21;
  padding: 16px;

  @media only screen and (max-width: 600px) {
    padding: 6px;
    padding-left: 50%;
    display: block;
    border: none;
    border-bottom: 1px solid #eee;
    position: relative;

    :before {
      position: absolute;
      top: 6px;
      left: 6px;
      width: 45%;
      padding-right: 10px;
      white-space: nowrap;
    }

    :nth-of-type(1):before {
      content: "Player";
    }
    :nth-of-type(2):before {
      content: "Team";
    }
    :nth-of-type(3):before {
      content: "Position";
    }
    :nth-of-type(4):before {
      content: "Total Rushing Yards";
    }
    :nth-of-type(5):before {
      content: "Longest Rush";
    }
    :nth-of-type(6):before {
      content: "Total Rushing Touchdowns";
    }
  }
`;

const SortCell = styled.th`
  cursor: ${props => (props.clickable ? "pointer" : "default")};
  text-align: left;
  padding: 12px;
  font-weight: 600;
  border-radius: 25px;
  transition: color 0.1s ease-in-out;
  ${props => props.active && "color: white;"} :hover {
    ${props => props.hoverable && "color: white;"}
  }
`;

SortCell.defaultProps = {
  clickable: true
};

const DownloadButton = styled.button`
  font-family: Roboto;
  border-style: border-box;
  background-color: #0078fd;
  height: 32px;
  border: none;
  font-size: 14px;
  color: #fff;
  display: block;
  cursor: pointer;
  text-align: center;
  font-weight: 500;
  line-height: 32px;
  border-radius: 4px;
  padding: 0 10px;
  transition: background-color 0.2s ease-in-out;

  :hover {
    background-color: rgb(84, 135, 172);
  }
`;

const PaginationButton = styled.button`
  font-family: Roboto;
  border-style: border-box;
  background-color: white;
  height: 32px;
  border: none;
  font-size: 14px;
  color: black;
  display: block;
  cursor: pointer;
  text-align: center;
  font-weight: 500;
  line-height: 32px;
  border-radius: 4px;
  padding: 0 10px;
  transition: background-color 0.2s ease-in-out;

  :hover {
    background-color: rgba(249, 249, 249, 0.65);
  }
`;

const PaginationControls = styled.div`
  display: flex;
  width: 40%;
  margin: 0 auto;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
`;

const TableControls = styled.div`
  display: flex;
  width: calc(100% - 32px);
  justify-content: space-between;
  align-items: baseline;
  padding: 16px;

  @media only screen and (max-width: 550px) {
    flex-direction: column-reverse;
    height: 150px;
  }
`;

const PlayerSearchField = styled.input`
  cursor: auto;
  box-sizing: border-box;
  height: 36px;
  width: 200px;
  background-color: rgb(255, 255, 255);
  color: rgb(0, 0, 0);
  font-size: 16px;
  line-height: 16px;
  border-width: 1px;
  border-style: solid;
  border-color: #0078fd;
  border-image: initial;
  border-radius: 4px;
  padding: 8px;
  margin: 4px 0px;
  letter-spacing: normal;
  word-spacing: normal;
  text-transform: none;
  text-indent: 0px;
  text-shadow: none;
  display: inline-block;
  text-align: start;
`;

function formatCellData(cell) {
  let cellData = cell;
  if (cellData && typeof cellData === "string") {
    // strips T values out of cells for sorting calculations
    if (cellData.includes("T")) {
      cellData = cellData.replace("T", "");
    }
    // strips commas out of cells for sorting calculations
    if (cellData.includes(",")) {
      cellData = cellData.replace(",", "");
    }
  }
  return cellData;
}

const sortResults = (players, key, sortOrder) =>
  players.sort((player1, player2) => {
    const filterOn1 = formatCellData(player1[key]);
    const filterOn2 = formatCellData(player2[key]);

    if (sortOrder === 0) {
      return Number(filterOn1) <= Number(filterOn2) ? 1 : -1;
    }
    return Number(filterOn1) > Number(filterOn2) ? 1 : -1;
  });

function Dashboard() {
  const [page, setPage] = React.useState(1);
  const [maxPage, setMaxPage] = React.useState(0);
  const [entries, setEntries] = React.useState(10);
  const [playerSearch, setPS] = React.useState("");
  // uses debounce hook to avoid extra api calls when user is typing in the
  // search field
  const debouncedPS = useDebounce(playerSearch, 750);
  const [results, setResults] = React.useState([]);
  const [filterKey, setFilterKey] = React.useState("");
  // 0 for ascending, 1 descending
  const [sortOrder, setSortOrder] = React.useState(0);

  const sortedResults = sortResults(results, filterKey, sortOrder);

  const disableNext =
    page === maxPage ||
    sortedResults.length === 0 ||
    sortedResults.length < entries;

  React.useEffect(() => {
    // makes api request for data when a search is made, a page change is
    // requested, or the number of entries changes
    async function searchRequest() {
      const { data } = await fetchPlayers({
        page,
        entries,
        search: debouncedPS
      });
      setResults(data.players);
      setMaxPage(Number(data.maxPage));
      setPage(Number(data.page));
    }
    searchRequest();
  }, [debouncedPS, page, entries]);

  // flip flop between ascending and descending sort
  // sets the active column being sorted on
  function updatePlayerSort(key) {
    if (key === filterKey) {
      if (sortOrder === 0) {
        setSortOrder(1);
      }
      if (sortOrder === 1) {
        setSortOrder(0);
      }
    } else {
      setSortOrder(0);
    }
    setFilterKey(key);
  }

  // appears in column headers
  // shows whether column is being sorted ascending or descending
  function showSortOrder(key) {
    if (filterKey !== key) {
      return null;
    }
    if (sortOrder === 0) {
      return "^";
    } else if (sortOrder === 1) {
      return "v";
    }
  }

  return (
    <>
      <Header />
      <Main>
        <TableControls>
          <PlayerSearchField
            placeholder="Search Players"
            value={playerSearch}
            onChange={e => setPS(e.target.value)}
          />
          <span>
            <label style={{ paddingRight: 12 }} htmlFor="Entries">
              Entries Showing
            </label>
            <select
              id="Entries"
              defaultValue={10}
              onChange={e => setEntries(e.target.value)}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
              <option value={100}>100</option>
            </select>
          </span>
          <DownloadButton
            disabled={sortedResults.length === 0}
            onClick={() => {
              const playerCSV = new CSV(sortedResults, "NFL Rushing Stats");
              playerCSV.generate();
              playerCSV.download();
            }}
          >
            Download CSV
          </DownloadButton>
        </TableControls>
        <PlayerTable>
          <thead>
            <tr>
              <SortCell clickable={false}>Player</SortCell>
              <SortCell clickable={false}>Team</SortCell>
              <SortCell clickable={false}>Position</SortCell>
              <SortCell
                data-testid="YdsCol"
                hoverable
                active={filterKey === "Yds"}
                onClick={() => updatePlayerSort("Yds")}
              >
                Total Rushing Yards {showSortOrder("Yds")}
              </SortCell>
              <SortCell
                data-testid="LngCol"
                hoverable
                active={filterKey === "Lng"}
                onClick={() => updatePlayerSort("Lng")}
              >
                Longest Rush {showSortOrder("Lng")}
              </SortCell>
              <SortCell
                data-testid="TdCol"
                hoverable
                active={filterKey === "Td"}
                onClick={() => updatePlayerSort("TD")}
              >
                Total Rushing Touchdowns {showSortOrder("TD")}
              </SortCell>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((player, i) => {
              const playerName = player["Player"];
              const totalRushingYards = player["Yds"];
              const longestRush = player["Lng"];
              const totalRushingTouchdowns = player["TD"];
              const team = player["Team"];
              const position = player["Pos"];
              return (
                <TableRow
                  onClick={() => navigate(`/player/${playerName}`)}
                  data-testid="tableRow"
                  key={playerName + i}
                >
                  <TableCell>{playerName}</TableCell>
                  <TableCell>{team}</TableCell>
                  <TableCell>{position}</TableCell>
                  <TableCell>{totalRushingYards}</TableCell>
                  <TableCell>{longestRush}</TableCell>
                  <TableCell>{totalRushingTouchdowns}</TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </PlayerTable>
        <PaginationControls>
          <PaginationButton
            disabled={page === 1}
            onClick={() => page !== 1 && setPage(Number(page - 1))}
          >
            Previous
          </PaginationButton>
          <span>Page {page}</span>
          <PaginationButton
            disabled={disableNext}
            onClick={() => page < maxPage && setPage(Number(page + 1))}
          >
            Next
          </PaginationButton>
        </PaginationControls>
      </Main>
    </>
  );
}

export default Dashboard;
