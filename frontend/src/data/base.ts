interface Item {
  pk: string;
  sk: string;
}

type AppointmentsViewModel = {
  items: [AppointmentItemViewModel];
};

interface AppointmentItemViewModel extends Item {
  duration: number;
  status: string;
  type: string;
}

export interface AppointmentViewModel {
  getAvailableAppointments: AppointmentsViewModel;
  lastEvaluatedKey: Item;
}
