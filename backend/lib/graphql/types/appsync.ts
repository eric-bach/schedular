export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  AWSDate: { input: string; output: string; }
  AWSDateTime: { input: string; output: string; }
  AWSEmail: { input: string; output: string; }
  AWSIPAddress: { input: string; output: string; }
  AWSJSON: { input: string; output: string; }
  AWSPhone: { input: string; output: string; }
  AWSTime: { input: string; output: string; }
  AWSTimestamp: { input: number; output: number; }
  AWSURL: { input: string; output: string; }
};

export type AdministratorDetailsInput = {
  firstName: Scalars['String']['input'];
  id: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
};

export type AdministratorDetailsViewModel = {
  __typename?: 'AdministratorDetailsViewModel';
  firstName?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
};

export type AdministratorInput = {
  firstName: Scalars['String']['input'];
  id: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
};

export type AppointmentDetailsInput = {
  category: Scalars['String']['input'];
  duration: Scalars['Int']['input'];
  pk: Scalars['String']['input'];
  sk: Scalars['String']['input'];
  status: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type AppointmentDetailsViewModel = {
  __typename?: 'AppointmentDetailsViewModel';
  category: Scalars['String']['output'];
  duration: Scalars['Int']['output'];
  pk: Scalars['String']['output'];
  sk: Scalars['AWSDateTime']['output'];
  status: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type AppointmentInput = {
  category: Scalars['String']['input'];
  duration: Scalars['Int']['input'];
  type: Scalars['String']['input'];
};

export type AppointmentViewModel = {
  __typename?: 'AppointmentViewModel';
  administratorDetails?: Maybe<AdministratorDetailsViewModel>;
  bookingId?: Maybe<Scalars['String']['output']>;
  category: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['AWSDateTime']['output']>;
  customerDetails?: Maybe<CustomerDetailsViewModel>;
  duration: Scalars['Int']['output'];
  pk: Scalars['String']['output'];
  sk: Scalars['AWSDateTime']['output'];
  status: Scalars['String']['output'];
  type: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['AWSDateTime']['output']>;
};

export type BookingResponse = {
  __typename?: 'BookingResponse';
  administratorDetails: AdministratorDetailsViewModel;
  appointmentDetails: AppointmentDetailsViewModel;
  createdAt?: Maybe<Scalars['AWSDateTime']['output']>;
  customerId?: Maybe<Scalars['String']['output']>;
  pk: Scalars['String']['output'];
  sk: Scalars['AWSDateTime']['output'];
  type: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['AWSDateTime']['output']>;
};

export type BookingsViewModel = {
  __typename?: 'BookingsViewModel';
  administratorDetails: AdministratorDetailsViewModel;
  appointmentDetails: AppointmentDetailsViewModel;
  createdAt?: Maybe<Scalars['AWSDateTime']['output']>;
  customerDetails: CustomerDetailsViewModel;
  customerId: Scalars['String']['output'];
  pk: Scalars['String']['output'];
  sk: Scalars['AWSDateTime']['output'];
  type: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['AWSDateTime']['output']>;
};

export type CancelBookingInput = {
  appointmentDetails: AppointmentDetailsInput;
  bookingId: Scalars['String']['input'];
};

export type CreateBookingInput = {
  administratorDetails: AdministratorInput;
  appointmentDetails: AppointmentInput;
  customer: CustomerInput;
  pk: Scalars['String']['input'];
  sk: Scalars['AWSDateTime']['input'];
};

export type CustomerDetailsViewModel = {
  __typename?: 'CustomerDetailsViewModel';
  email: Scalars['String']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  phone: Scalars['String']['output'];
};

export type CustomerInput = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  id: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  phone: Scalars['String']['input'];
};

export type DeleteAppointmentResponse = {
  __typename?: 'DeleteAppointmentResponse';
  pk?: Maybe<Scalars['ID']['output']>;
  sk?: Maybe<Scalars['AWSDateTime']['output']>;
};

export type GetAppointmentResponse = {
  __typename?: 'GetAppointmentResponse';
  administratorDetails?: Maybe<AdministratorDetailsViewModel>;
  administratorId: Scalars['String']['output'];
  bookingId?: Maybe<Scalars['String']['output']>;
  category: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['AWSDateTime']['output']>;
  customerDetails?: Maybe<CustomerDetailsViewModel>;
  duration: Scalars['Int']['output'];
  pk: Scalars['String']['output'];
  sk: Scalars['AWSDateTime']['output'];
  status: Scalars['String']['output'];
  type: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['AWSDateTime']['output']>;
};

export type GetAppointmentsResponse = {
  __typename?: 'GetAppointmentsResponse';
  items?: Maybe<Array<Maybe<AppointmentViewModel>>>;
  lastEvaluatedKey?: Maybe<LastEvaluatedKeyViewModel>;
};

export type GetBookingResponse = {
  __typename?: 'GetBookingResponse';
  administratorDetails: AdministratorDetailsViewModel;
  appointmentDetails: AppointmentDetailsViewModel;
  createdAt?: Maybe<Scalars['AWSDateTime']['output']>;
  customerDetails: CustomerDetailsViewModel;
  customerId: Scalars['String']['output'];
  pk: Scalars['String']['output'];
  sk: Scalars['AWSDateTime']['output'];
  type: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['AWSDateTime']['output']>;
};

export type GetBookingsResponse = {
  __typename?: 'GetBookingsResponse';
  items?: Maybe<Array<Maybe<BookingsViewModel>>>;
  lastEvaluatedKey?: Maybe<LastEvaluatedKeyViewModel>;
};

export type GetCountsResponse = {
  __typename?: 'GetCountsResponse';
  count: Scalars['Int']['output'];
  date: Scalars['String']['output'];
};

export type LastEvaluatedKey = {
  pk?: InputMaybe<Scalars['ID']['input']>;
  sk?: InputMaybe<Scalars['AWSDateTime']['input']>;
};

export type LastEvaluatedKeyViewModel = {
  __typename?: 'LastEvaluatedKeyViewModel';
  pk: Scalars['ID']['output'];
  sk: Scalars['AWSDateTime']['output'];
};

export type ListUsersResponse = {
  __typename?: 'ListUsersResponse';
  nextToken?: Maybe<Scalars['String']['output']>;
  users?: Maybe<Array<Maybe<UserResponse>>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addUserToGroup?: Maybe<Scalars['Boolean']['output']>;
  cancelBooking?: Maybe<BookingResponse>;
  createBooking?: Maybe<BookingResponse>;
  upsertDeleteAppointments?: Maybe<UpsertDeleteAppointmentsResponse>;
};


export type MutationAddUserToGroupArgs = {
  groupName: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type MutationCancelBookingArgs = {
  input?: InputMaybe<CancelBookingInput>;
};


export type MutationCreateBookingArgs = {
  input?: InputMaybe<CreateBookingInput>;
};


export type MutationUpsertDeleteAppointmentsArgs = {
  input?: InputMaybe<UpsertAppointmentsInput>;
};

export type Query = {
  __typename?: 'Query';
  getAppointment?: Maybe<GetAppointmentResponse>;
  getAppointmentCounts?: Maybe<Array<Maybe<GetCountsResponse>>>;
  getAppointments?: Maybe<GetAppointmentsResponse>;
  getAvailableAppointments?: Maybe<GetAppointmentsResponse>;
  getBooking?: Maybe<GetBookingResponse>;
  getBookings?: Maybe<GetBookingsResponse>;
  getUserBookings?: Maybe<GetBookingsResponse>;
  listUsersInGroup?: Maybe<ListUsersResponse>;
};


export type QueryGetAppointmentArgs = {
  pk: Scalars['String']['input'];
  sk: Scalars['String']['input'];
};


export type QueryGetAppointmentCountsArgs = {
  from: Scalars['String']['input'];
  status: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type QueryGetAppointmentsArgs = {
  from: Scalars['String']['input'];
  lastEvaluatedKey?: InputMaybe<LastEvaluatedKey>;
  to: Scalars['String']['input'];
};


export type QueryGetAvailableAppointmentsArgs = {
  from: Scalars['String']['input'];
  lastEvaluatedKey?: InputMaybe<LastEvaluatedKey>;
  to: Scalars['String']['input'];
};


export type QueryGetBookingArgs = {
  pk: Scalars['String']['input'];
  sk: Scalars['String']['input'];
};


export type QueryGetBookingsArgs = {
  datetime: Scalars['String']['input'];
  lastEvaluatedKey?: InputMaybe<LastEvaluatedKey>;
};


export type QueryGetUserBookingsArgs = {
  customerId: Scalars['String']['input'];
  datetime: Scalars['String']['input'];
  lastEvaluatedKey?: InputMaybe<LastEvaluatedKey>;
};


export type QueryListUsersInGroupArgs = {
  groupName: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  onCancelBooking?: Maybe<BookingResponse>;
};

export type UpsertAppointmentInput = {
  administratorDetails: AdministratorDetailsInput;
  category: Scalars['String']['input'];
  duration: Scalars['Int']['input'];
  pk: Scalars['ID']['input'];
  sk: Scalars['AWSDateTime']['input'];
  status: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type UpsertAppointmentResponse = {
  __typename?: 'UpsertAppointmentResponse';
  administratorDetails?: Maybe<AdministratorDetailsViewModel>;
  category?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['Int']['output']>;
  pk?: Maybe<Scalars['ID']['output']>;
  sk?: Maybe<Scalars['AWSDateTime']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type UpsertAppointmentsInput = {
  appointments?: InputMaybe<Array<InputMaybe<UpsertAppointmentInput>>>;
};

export type UpsertDeleteAppointmentsResponse = {
  __typename?: 'UpsertDeleteAppointmentsResponse';
  deleted?: Maybe<Array<Maybe<DeleteAppointmentResponse>>>;
  upserted?: Maybe<Array<Maybe<UpsertAppointmentResponse>>>;
};

export type UserResponse = {
  __typename?: 'UserResponse';
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  phoneNumber: Scalars['String']['output'];
};
