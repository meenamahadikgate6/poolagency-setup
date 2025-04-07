import { Meta, StoryObj } from '@storybook/angular';
import { LoginComponent } from '../app/login/login.component';

const meta: Meta<LoginComponent> = {
  title: 'Auth/LoginModal',
  component: LoginComponent,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<LoginComponent>;

export const Default: Story = {
  args: {
    show: true,
  },
  render: (args) => ({
    component: LoginComponent,
    props: {
      ...args,
      login: (data: any) => {
        console.log('Mock login:', data);
        alert(`Login attempt with ${JSON.stringify(data)}`);
      },
      close: () => {
        console.log('Modal closed');
        alert('Modal closed');
      },
    },
  }),
};
