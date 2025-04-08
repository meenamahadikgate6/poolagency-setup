import { Meta, StoryFn } from '@storybook/angular';
import { StatusBadgeComponent } from '../app/components/status-badge/status-badge.component';

export default {
  title: 'Components/StatusBadge',
  component: StatusBadgeComponent,
  tags: ['autodocs'],
} as Meta;

const Template: StoryFn = (args) => ({
  props: args,
});

export const Alerts = Template.bind({});
Alerts.args = {
  count: 909,
  label: 'ALERTS',
  color: 'blue',
};

export const IssueReports = Template.bind({});
IssueReports.args = {
  count: 206,
  label: 'ISSUE REPORTS',
  color: 'red',
};

export const NotCompleted = Template.bind({});
NotCompleted.args = {
  count: 704,
  label: 'NOT COMPLETED',
  color: 'orange',
};
