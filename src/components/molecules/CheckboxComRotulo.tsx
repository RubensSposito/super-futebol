import { Checkbox } from "@/components/atoms";

type CheckboxComRotuloProps = {
  rotulo: string;
  marcado: boolean;
  accessibilityLabel: string;
  desabilitado?: boolean;
  onChange: (marcado: boolean) => void;
};

export function CheckboxComRotulo(props: CheckboxComRotuloProps) {
  return <Checkbox {...props} />;
}
