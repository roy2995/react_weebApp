import PieChart from './PieChart';

const defaultData = {
  labels: ['Rojo', 'Azul', 'Amarillo'],
  datasets: [
    {
      label: 'Colores',
      data: [300, 50, 100],
      backgroundColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 205, 86)'],
      hoverOffset: 4,
    },
  ],
};

export default {
  title: 'Charts/PieChart',
  component: PieChart,
  argTypes: {
    data: { control: 'object' },
  },
};

const Template = (args) => <PieChart {...args} />;

export const Default = Template.bind({});
Default.args = {
  data: defaultData,
};
