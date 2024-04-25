class TextService {
  getNumbers() {
    return [1, 3, 5];
  }
}

const { Controller, AfterEach, BaseController, ...D } = useHttpDecorator();

@Controller()
class TextController extends BaseController {
  service: TextService;
  __setup() {
    this.__basePath = "/services";
    this.service = new TextService()
  }



  @D.Get()
  ben(@D.Query() body: any, @D.ReqExtract('session.user') session: any) {
    // throw new APIError("Not implemented", 400);
    // return { result: this.t, body };
    this.respondWith({ body, session }, 400)
  }
}