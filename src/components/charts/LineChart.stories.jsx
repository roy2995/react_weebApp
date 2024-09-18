import LineChart from './LineChart';

const defaultData = {
  labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
  datasets: [
    {
      label: 'Ventas',
      data: [12, 19, 3, 5, 2, 3],
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
    },
  ],
};

export default {
  title: 'Charts/LineChart',
  component: LineChart,
  argTypes: {
    data: { control: 'object' },
  },
};

const Template = (args) => <LineChart {...args} />;

export const Default = Template.bind({});
Default.args = {
  data: defaultData,
};
