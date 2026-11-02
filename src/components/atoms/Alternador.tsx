import { Switch } from "react-native";
import { colors } from "@/theme";

type AlternadorProps = {
  valor: boolean;
  rotuloAcessibilidade: string;
  onChange: (valor: boolean) => void;
};

export function Alternador({
  valor,
  rotuloAcessibilidade,
  onChange,
}: AlternadorProps) {
  return (
    <Switch
      accessibilityRole="switch"
      accessibilityLabel={rotuloAcessibilidade}
      accessibilityState={{ checked: valor }}
      value={valor}
      onValueChange={onChange}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={colors.surface}
      ios_backgroundColor={colors.border}
    />
  );
}
