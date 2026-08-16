"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function FloatingResourcesButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.button
          type="button"
          aria-label="Abrir recursos complementares ASE"
          className="fixed bottom-5 right-5 z-40 flex items-center justify-center rounded-full bg-primary p-3 text-primary-foreground shadow-pop transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
        >
          <img
            src="/icons/icon-192.png"
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-full"
            loading="eager"
          />
        </motion.button>
      </DialogTrigger>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img
              src="/icons/icon-192.png"
              alt=""
              width={24}
              height={24}
              className="size-6 rounded-md"
            />
            Recursos complementares
          </DialogTitle>
          <DialogDescription>
            Acesse recursos complementares pelo link abaixo.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Explore materiais extras, conteúdos e ferramentas para aprofundar a
            Avaliação de Saúde Espiritual do seu Pequeno Grupo.
          </p>
          <Button asChild className="w-full gap-2">
            <a
              href="https://linktr.ee/hebrom.ase"
              target="_blank"
              rel="noopener noreferrer"
            >
              Acessar recursos
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
