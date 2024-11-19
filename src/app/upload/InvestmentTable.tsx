import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Investimento } from "../components/lib/interfaces";

interface InvestmentTableProps {
  investments: Investimento[];
}

const InvestmentTable: React.FC<InvestmentTableProps> = ({ investments }) => {
  return (
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead>Data Referência</TableHead>
          {Object.keys(investments[0]).filter(key => key !== 'dataReferencia').map((key) => (
            <TableHead key={key}>{key}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {investments.map((investment, index) => (
          <TableRow key={`${investment.Ativo}-${index}`}>
            <TableCell>{investment.dataReferencia?.toLocaleDateString('pt-BR')}</TableCell>
            {Object.entries(investment)
              .filter(([key]) => key !== 'dataReferencia')
              .map(([key, value]) => (
                <TableCell key={key}>{value}</TableCell>
              ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default InvestmentTable;
