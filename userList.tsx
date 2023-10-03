import { useCallback, useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { InputAdornment, CircularProgress, Table, TableBody, TableCell, TableContainer, Paper, Select, SelectChangeEvent, TableHead, TableRow } from '@mui/material';
import { SidebarNavigation } from '../../shared/components/sidebarNavigation/SidebarNav';
import { AccountCircleOutlined, ArrowForwardOutlined } from '@mui/icons-material';
import { ContentContainer, ButtonContainer, Main, SingleButtonContainer, StyledTitle, StyledButton, StyledInput, StyledSubtitle, UserListContainer, SearchForm, SearchBar, StyledMenuItem } from './EditUserList.styled';
import { useGetAllUsersQuery, useSetNewRolesMutation } from '../../redux/slicesApi/userListApi';
import { UserRole } from '../AuthorizedSection';
import FormControl from '@mui/material/FormControl';
import { ICurrentUserResponse, IUsersToUpdate, ISearchUserProps } from '../../types/user';

const userRoleOptions = Object.values(UserRole)
  .map((value) => ({ value }))
  .filter((el) => (el.value !== UserRole.ADMIN));

const validationSchema: Yup.ObjectSchema<ISearchUserProps> = Yup.object().shape({
  keyword: Yup.string().nullable(),
  userRole: Yup.string().oneOf(['all', UserRole.AUTHOR, UserRole.USER])
});

export const EditUserList = () => {
  const { data, refetch, isLoading: isAllUsersLoading, error: getAllUsersError } = useGetAllUsersQuery();
  const [setNewRoles, { isLoading: setNewRolesLoading, error: setNewRolesError }] = useSetNewRolesMutation();
  const [userListData, setUserListData] = useState<ICurrentUserResponse[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ICurrentUserResponse[]>([]);
  const [usersToUpdateRoles, setUsersToUpdate] = useState<IUsersToUpdate[]>([]);
  const [previewUsersMode, setPreviewMode] = useState<boolean>(false);

  // we update userListData in case data is changed
  useEffect(() => {
    if (data) {
      setUserListData(data);
    }
  }, [data]);

  // we update filtered users data in case userlist data changes. Userlist data is not the same as data as we keep all the changes in user roles while we don't change the page or press 'save' button
  useEffect(() => {
    if (userListData) {
      setFilteredUsers(userListData);
    }
  }, [userListData])

  const updateLocalUserList = useCallback((event: SelectChangeEvent<string>, currentUserId: string) => {
    // we search for user with the same id and set him new role in userlist data
    const updatedUserListData = userListData.map((el: ICurrentUserResponse) => {
      if (el.id === currentUserId) {
        return { ...el, role: event.target.value };
      }
      return el;
    });
    // when we set userlist data, filtered users array is updated and ready for the new changes
    setUserListData(updatedUserListData);
  }, [userListData]);

  const { control, handleSubmit, setValue, register, watch } = useForm<ISearchUserProps>({
    defaultValues: {
      keyword: '',
      userRole: 'all',
    },
    resolver: yupResolver(validationSchema),
  });

// function for creating array of users to update roles
  const previewChanges = useCallback(() => {
    // userlist data - data with changed roles
    const newUsersToUpdateRoles = userListData.reduce((accumulator: IUsersToUpdate[], userToUpdate) => {
      // data - data from the server
      const currentUser = data?.find((currentUser) => currentUser.id === userToUpdate.id);
      // we compare two values of users' roles
      if (currentUser?.role !== userToUpdate.role) {
        accumulator.push({
          userId: userToUpdate.id,
          role: userToUpdate.role,
          userName: userToUpdate.userName
        });
      }
      return accumulator;
    }, []);
    setUsersToUpdate(newUsersToUpdateRoles);
    setPreviewMode(true);
  }, [data, userListData, usersToUpdateRoles]);

  // here we push changes and go back to the list of users
  const confirmNewRoles = useCallback(async () => {
    await (setNewRoles(usersToUpdateRoles));
    if (setNewRolesError) { alert('New roles did not update'); };
    await refetch();
    setPreviewMode(false);
  }, [usersToUpdateRoles, refetch, setNewRoles, setNewRolesError])

  // here we filter users in case form is not empty. There are two inputs - roles(select) and input for searching by email or username. We change filtered users in case of they are not empty
  const onSubmit: SubmitHandler<ISearchUserProps> = useCallback(({ keyword, userRole }) => {
    let newFilteredData = userListData ? [...userListData] : [];
    if (userRole !== 'all') {
      newFilteredData = newFilteredData?.filter((user) => (user.role === userRole));
    }
    if (keyword) {
      newFilteredData = newFilteredData?.filter((user) => (
        user.email.toLowerCase().includes(keyword.toLowerCase()) ||
        user.userName.toLowerCase().includes(keyword.toLowerCase())
      ));
    }
    setFilteredUsers(newFilteredData);
  }, [filteredUsers, userListData]);

  // ------------------- end of logic -----------------------------------
  return (
    <ContentContainer>
      <SidebarNavigation />
      <Main>
        <StyledTitle>Users List</StyledTitle>

        {getAllUsersError
          ? <p>Oops, something went wrong. Try to update the page.</p>
          : null
        }

        {!previewUsersMode
          ? <div>
            <StyledSubtitle>Search users</StyledSubtitle>
            <SearchBar>
              <SearchForm onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  name='keyword'
                  control={control}
                  render={({ field }) => (
                    <StyledInput
                      size='small'
                      value={field.value}
                      onChange={field.onChange}
                      placeholder='Enter the nickname or email...'
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <AccountCircleOutlined />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                <Select
                  {...register('userRole')}
                  sx={{
                    fontSize: '15px', fontWeight: 500, width: '100px',
                    '& .MuiInputBase-input': { padding: '3px 10px' }
                  }}
                  displayEmpty
                  style={{ padding: '5px' }}
                  variant='outlined'
                  value={watch('userRole') || 'all'}
                  onChange={(e: SelectChangeEvent<string>) => {
                    setValue('userRole', e.target.value);
                  }}
                  IconComponent={ArrowForwardOutlined}
                >
                  <StyledMenuItem key='default' value='all' selected>
                    Roles
                  </StyledMenuItem>
                  {userRoleOptions.map((option) => (
                    <StyledMenuItem key={option.value} value={option.value}>
                      {option.value}
                    </StyledMenuItem>
                  ))}
                </Select>

                <StyledButton variant='outlined' type='submit'>Search</StyledButton>
              </SearchForm>
              <StyledButton variant='contained' onClick={previewChanges}>Save</StyledButton>
            </SearchBar>

            <UserListContainer>
              {isAllUsersLoading
                ? <CircularProgress />
                : <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} aria-label='simple table'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nickname</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers?.map((user) => (
                        user.role !== UserRole.ADMIN
                          ? <TableRow
                            key={user.id}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell component='th' scope='row'>
                              {user.userName}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <FormControl sx={{ width: '100px' }}>
                                <Select
                                  variant='standard'
                                  sx={{
                                    fontSize: '15px',
                                    fontWeight: 500,
                                  }}
                                  disableUnderline
                                  value={user.role}
                                  onChange={(e) => updateLocalUserList(e, user.id)}
                                  IconComponent={ArrowForwardOutlined}
                                >
                                  {userRoleOptions.map((option) => (
                                    <StyledMenuItem key={option.value} value={option.value}>
                                      {option.value}
                                    </StyledMenuItem>
                                  )
                                  )}
                                </Select>
                              </FormControl>
                            </TableCell>
                          </TableRow>
                          : null
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>}
            </UserListContainer>
          </div>
          : <div>
            {usersToUpdateRoles.length > 0
              ? <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nickname</TableCell>
                      <TableCell>Role</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usersToUpdateRoles.map((el) =>
                    (<TableRow key={el.userId}>
                      <TableCell>{el.userName}</TableCell>
                      <TableCell>{el.role}</TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ButtonContainer>
                  {setNewRolesLoading
                    ? <CircularProgress />
                    : <StyledButton variant='contained' onClick={confirmNewRoles}>Save</StyledButton>}
                  <StyledButton variant='outlined' onClick={() => { setUsersToUpdate([]); setPreviewMode(false) }}>Return</StyledButton>
                </ButtonContainer>
              </TableContainer>
              : <div>
                <p>There is no data to update...</p>
                <SingleButtonContainer>
                  <StyledButton variant='outlined' onClick={() => setPreviewMode(false)}>Back to the list of users</StyledButton>
                </SingleButtonContainer>
              </div>
            }
          </div>
        }
      </Main >
    </ContentContainer >
  )
}
