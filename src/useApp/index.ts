import { Express } from "express";
export default function (app: Express) {
  const _app = app;
  const use = (...args: any[]) => {
    _app.use(...args);
    return _app;
  }

  const useAll = (args: any[]) => {
    args.map((arg) => {
      _app.use(arg)
    })

    return _app;
  }

  const set = (setting: string, val: any) => {
    _app.set(setting, val)
  }

  const setup = (_setup: Record<string, any[]>) => {
    Object.entries(_setup).map(([key, value]) => {
      (_app as any)[key](...value)
    })
    return _app;
  }

  return {
    app: _app,
    setup,
    set,
    use,
    useAll
  }
}