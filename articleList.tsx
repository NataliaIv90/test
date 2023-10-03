import { useEffect, useState } from 'react';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import TagOutlinedIcon from '@mui/icons-material/TagOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import ButtonGroup from '@mui/material/ButtonGroup';
import {
  ArticleListWrapper,
  BrandColorSpan,
  ArticleListContainer,
  StyledTextButton,
  TrendingContent,
  TrendingContentContainer,
  StyledSubtitle,
  AdminMenu,
  ArticleListHeader,
  SidebarList,
  ArticleListHeaderLinks,
  StyledMenuItem
} from './ArticleList.styled';
import { IArticlePreviewItemData, EArticleSortOptions } from '../../../types/article';
import { ArticleCard } from '../articleCard/ArticleCard';
import { CircularProgress } from '@mui/material';
import { useGetArticlesListQuery } from '../../../redux/slicesApi/articlesApi';
import { useGetUserQuery } from '../../../redux/slicesApi/authSliceApi';
import { skipToken } from '@reduxjs/toolkit/dist/query';
import { UserRole } from '../../AuthorizedSection';
import { useNavigate } from 'react-router-dom';

// todo: api call for filtered articles
const buttonGroupProp = [
  { filterValue: 'latest', text: 'Last Articles', sortBy: EArticleSortOptions.ByDate },
  // { filterValue: 'topRated', text: 'Top Rated', sortBy: EArticleSortOptions.TopRated },
  { filterValue: 'all', text: 'All Posts', sortBy: EArticleSortOptions.AllPostsList }
];

const sortOptionsProps = [
  { value: 'byDate', text: 'Date' },
  { value: 'byAuthor', text: 'Author' },
  { value: 'byName', text: 'Name' },
  { value: 'defaultList', text: 'Default' }
];

export const ArticleList = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState<number>(1);
  const [sort, setSort] = useState<EArticleSortOptions>(EArticleSortOptions.ByDate);
  // todo: uncomment when will be endpoint for latest, toprated articles
  // const [displayedArticles, setDisplayedArticles] = useState('latest');
  const tokens = localStorage.getItem('tokens');
  const { data: userData } = useGetUserQuery(tokens ?? skipToken);

  const { data: articleListData, isLoading, error } = useGetArticlesListQuery();
  const [sortedArticles, setSortedArticles] = useState<IArticlePreviewItemData[]>([]);

  // ----------sort article list in case of 'sort by' changed 
  useEffect(() => {
    if (!Array.isArray(articleListData)) return;
    const sortedData = [...articleListData];

    switch (sort) {
      case EArticleSortOptions.ByDate:
        sortedData.sort((b, a) => a.created.localeCompare(b.created));
        break;
      case EArticleSortOptions.ByAuthor:
        sortedData.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case EArticleSortOptions.ByName:
        sortedData.sort((a, b) => a.name.localeCompare(b.name));
        break;
      // todo: add case for TopRated
    }
    setSortedArticles(sortedData);
  }, [articleListData, sort]);

  return (
    <ArticleListWrapper>
        <ArticleListHeader>
          <ArticleListHeaderLinks>
            <ButtonGroup variant="text" aria-label="text button group">

              {buttonGroupProp.map(({ filterValue, text, sortBy }) => (
                <StyledTextButton
                  key={sortBy}
                  disableRipple
                  onClick={() => {
                    // todo: when there will be endpoint for latest, top, all articles, move off setSort  
                    // setDisplayedArticles(filterValue);
                    setSort(sortBy);
                  }}
                  small={1}
                  // todo: when there will be endpoint for latest, top, all articles, use (displayedArticles===filterValue)
                  active={Number(sort === sortBy)}
                >{text}</StyledTextButton>
              ))}

            </ButtonGroup>
          </ArticleListHeaderLinks>

          <FormControl sx={{ width: '160px' }}>
            <Select
              variant='standard'
              sx={{
                fontSize: '15px',
                fontWeight: 500,
              }}
              disableUnderline
              value={sort}
              onChange={(event: SelectChangeEvent) => {
                setSort(event.target.value as EArticleSortOptions);
              }}
              IconComponent={ArrowForwardOutlinedIcon}
            >

              {sortOptionsProps.map(({ value, text }) => (
                <StyledMenuItem key={value} value={value}>Sort by {text}</StyledMenuItem>)
              )}

            </Select>
          </FormControl>

        </ArticleListHeader>
        <ArticleListContainer>

          {isLoading ? <CircularProgress /> : null}

          {error ? <div>Something went wrong... Try to update page.</div> : null}

          {sortedArticles && Array.isArray(sortedArticles)
            ? sortedArticles.slice(page * 10 - 10, page * 10)
              .map((article) => (
                <ArticleCard data={article} key={article.id} />
              ))
            : null
          }

          <Stack spacing={2}>
            <Pagination
              count={Array.isArray(sortedArticles) ? Math.ceil((sortedArticles).length / 10) : 10}
              page={page}
              onChange={(e, value) => { setPage(value) }}
              variant="outlined"
              shape="rounded"
              renderItem={(item) => (
                <PaginationItem
                  slots={{ previous: ArrowBackIcon, next: ArrowForwardIcon }}
                  {...item}
                />
              )} />
          </Stack>

        </ArticleListContainer>    
    </ArticleListWrapper >
  )
}
