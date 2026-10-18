export interface ParamArgs<
  Where = undefined,
  OrderBy = undefined,
  Include = undefined,
  Select = undefined,
> {
  where?: Where;
  orderBy?: OrderBy;
  include?: Include;
  select?: Select;
}
