import PolarAreaChart from './PolarAreaChart';

const defaultData = {
  labels: ['Rojo', 'Azul', 'Amarillo', 'Verde'],
  datasets: [
    {
      label: 'Mi Dataset',
      data: [11, 16, 7, 3],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

export default {
  title: 'Charts/PolarAreaChart',
  component: PolarAreaChart,
  argTypes: {
    data: { control: 'object' },
  },
};

const Template = (args) => <PolarAreaChart {...args} />;

export const Default = Template.bind({});
Default.args = {
  data: defaultData,
};
