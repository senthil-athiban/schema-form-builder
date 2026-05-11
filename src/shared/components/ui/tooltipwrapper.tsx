import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

const TooltipWrapper = ({ children, tooltip , side}: { children: React.ReactNode, tooltip: string; side: "top" | "right" | "bottom" | "left" }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} align="center">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TooltipWrapper;