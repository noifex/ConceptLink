import { TextField } from '@mui/material';

type SearchBoxProps = {
  keyword: string;
  setKeyword: (keyword: string) => void;
};

function SearchBox({ keyword, setKeyword }: SearchBoxProps) {
  return (
    <TextField
      fullWidth
      value={keyword}
      onChange={(e) => setKeyword(e.target.value)}
      placeholder="検索..."
      size="small"
    />
  );
}

export default SearchBox;